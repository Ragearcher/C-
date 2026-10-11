#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
C语言冒险岛 · 发布打包脚本

解决三个手动打包容易犯的错：
  1. 压缩根目录搞错 —— 把开发仓库目录一起打进包（v1.0.1 的 520MB 包里 428 个条目是仓库副本）
  2. 忘记修改 resources/app/version.json 的版本号
  3. 打包后没有校验包内版本号

用法：
  python pack-release.py --tag v1.0.1                       # 只生成发布 zip
  python pack-release.py --tag v1.0.1 --sync-repo           # 顺带把代码同步进 git 仓库
  python pack-release.py --tag v1.0.1 --installer-tag v1.0.0 --installer
                                                            # 额外重建桌面安装包 exe

默认路径（可被参数覆盖）：
  源目录   = 安装根目录 D:\\Tools\\C语言冒险岛
  输出目录 = 桌面\\我的冒险岛
"""

import argparse
import hashlib
import json
import os
import shutil
import struct
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
INSTALL_ROOT = os.path.dirname(REPO_ROOT)
REPO_PAYLOAD = os.path.join(REPO_ROOT, 'C语言冒险岛')

DEFAULT_OUT = os.path.join(os.path.expanduser('~'), 'Desktop', '我的冒险岛')
DEFAULT_SFX_TEMPLATE = os.path.join(os.path.expanduser('~'), 'Desktop', 'C语言冒险岛安装包.exe')

GITHUB_REPO = 'Ragearcher/C-'
EXE_NAME = 'C++ 冒险岛.exe'
MANIFEST_REL = os.path.join('resources', 'app', 'version.json')

# 不允许进入压缩包的顶层条目
EXCLUDE_TOP = {'C语言冒险岛', 'tools', 'desktop.ini', 'Thumbs.db'}
EXCLUDE_SUFFIX = ('.zip', '.lnk', '.tmp', '.log')


def log(msg):
    print(msg, flush=True)


def check(ok, msg):
    log(('  [通过] ' if ok else '  [失败] ') + msg)
    return ok


def manifest_for(tag):
    return json.dumps(
        {'version': str(tag).lstrip('vV'), 'tag': tag, 'githubRepo': GITHUB_REPO},
        ensure_ascii=False, separators=(',', ':')
    )


def walk_payload(src, include_repo=False):
    """遍历待打包文件，返回 (绝对路径, 包内相对路径)。"""
    for dirpath, dirnames, filenames in os.walk(src):
        rel_dir = os.path.relpath(dirpath, src)
        if rel_dir == '.':
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_TOP or (include_repo and d == 'C语言冒险岛')]
        for name in sorted(filenames):
            abspath = os.path.join(dirpath, name)
            relpath = os.path.relpath(abspath, src)
            top = relpath.split(os.sep)[0]
            if not include_repo and top in EXCLUDE_TOP:
                continue
            if relpath.lower().endswith(EXCLUDE_SUFFIX):
                continue
            if name in EXCLUDE_TOP:
                continue
            yield abspath, relpath.replace(os.sep, '/')


PAD_NAME = '_padding_do_not_extract.bin'


def build_zip(src, tag, out_zip, include_repo=False, pad_to=None):
    log('[1] 打包 ' + out_zip)
    manifest = manifest_for(tag)
    count = 0
    total = 0
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for abspath, relpath in walk_payload(src, include_repo):
            if relpath == MANIFEST_REL.replace(os.sep, '/'):
                # 版本号由脚本统一注入，不取源目录的值
                zf.writestr(relpath, manifest)
            else:
                zf.write(abspath, relpath)
            count += 1
            total += os.path.getsize(abspath)
    log('    条目 %d 个，原始 %s' % (count, human(total)))
    if pad_to:
        pad_zip_to(out_zip, pad_to)
    return count


def pad_zip_to(out_zip, target):
    """
    把压缩包精确补齐到 target 字节。

    自解压存根要求内嵌载荷长度与预留容量严格相等：
      * 前面补零 -> ZIP 内记录的本地文件头偏移整体错位，解压报错
      * 后面补零 -> 中央目录结束记录跑出尾部回溯窗口，解压静默失败
    所以只能在 ZIP 内部加一个未压缩的占位条目来凑长度。
    setup.bat 会在复制到安装目录之前把它删掉，不会留下垃圾文件。
    """
    base = os.path.getsize(out_zip)
    # 新增一个条目对包大小的贡献 = 本地头(30+名称) + 中央目录项(46+名称)
    overhead = 76 + 2 * len(PAD_NAME)
    data_size = target - base - overhead
    if data_size < 0:
        raise SystemExit('内容 %s 已超过预留容量 %s，无法补齐'
                         % (human(base), human(target)))
    info = zipfile.ZipInfo(PAD_NAME, date_time=(2020, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_STORED
    info.external_attr = 0o600 << 16
    info.file_size = data_size
    info.compress_size = data_size
    with zipfile.ZipFile(out_zip, 'a') as zf:
        with zf.open(info, 'w') as w:
            chunk = b'\x00' * (4 << 20)
            left = data_size
            while left > 0:
                n = min(left, len(chunk))
                w.write(chunk[:n])
                left -= n
    final = os.path.getsize(out_zip)
    if final != target:
        raise SystemExit('载荷补齐失败：%d != %d' % (final, target))
    log('    占位条目 %s %s，载荷已精确补齐到 %s'
        % (PAD_NAME, human(data_size), human(final)))


def verify_zip(out_zip, tag, expect_repo=False):
    log('[2] 校验压缩包内容')
    ok = True
    with zipfile.ZipFile(out_zip) as zf:
        names = zf.namelist()
        ok &= check(MANIFEST_REL.replace(os.sep, '/') in names,
                    '包内存在 resources/app/version.json')
        try:
            data = json.loads(zf.read(MANIFEST_REL.replace(os.sep, '/')).decode('utf-8'))
        except Exception as e:
            data = {}
            ok &= check(False, '无法解析包内 version.json：%s' % e)
        ok &= check(data.get('tag') == tag,
                    '包内版本号 = %s（目标 %s）' % (data.get('tag'), tag))
        nested = [n for n in names if n.startswith('C语言冒险岛/')]
        if expect_repo:
            log('  [信息] 安装包保留仓库目录条目 %d 个（与原安装包布局一致）' % len(nested))
        else:
            ok &= check(not nested, '包内没有误打入的开发仓库目录')
        ok &= check(EXE_NAME in names, '包内存在 %s' % EXE_NAME)
        bad = [n for n in names if n.lower().endswith(('.zip', '.lnk'))]
        ok &= check(not bad, '包内没有多余的 zip / 快捷方式')
    return ok


def human(n):
    for unit in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or unit == 'GB':
            return '%.1f %s' % (n, unit)
        n /= 1024.0


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------------------
# 重建桌面安装包
#
# 安装包结构（逆向得到，见 sfx-layout.json）：
#   [0,1948)                  PE 头 + 自解压存根代码
#   [1948, 1948+payload_len)  内嵌 ZIP 载荷
#   [紧跟其后, 4274 字节)       .NET 自解压启动器（负责解压 + 建桌面快捷方式）
#   [最后]                    .rsrc / .reloc 段
#
# 重建策略：优先「同长补零」，完全不动 PE 头；
# 只有当新载荷比原载荷大时才后移启动器与段表，并同步修正段表里的偏移。
# ---------------------------------------------------------------------------
def build_installer(zip_path, out_exe, layout_path, head_path, tail_path):
    """
    重建桌面安装包。

    这个 PE 其实是一个 .NET 自解压程序，约束比看上去严得多：

    1. .NET 元数据（BSJB 段）在 .text 末尾，位置被 CLR 头以 RVA 引用。
       RVA 映射到文件偏移依赖段表，所以元数据、.rsrc、.reloc 的文件偏移
       一个字节都不能动 —— 移动就会变成「不是有效的 Win32 应用程序」。
    2. 存根从文件尾部向前回溯查找 ZIP 的中央目录结束记录（EOCD），
       并且要求 ZIP 从偏移 1948 开始。载荷前面补零会让 ZIP 内记录的
       本地文件头偏移整体错位，后面补零会让 EOCD 跑出回溯窗口。

    结论：载荷长度必须与预留容量严格相等。这个由 pad_zip_to() 在打包时
    用一个未压缩占位条目补齐，安装脚本会在复制前删掉它。
    """
    log('[3] 重建桌面安装包 ' + out_exe)
    layout = json.load(open(layout_path, encoding='utf-8'))
    head = open(head_path, 'rb').read()
    tail = open(tail_path, 'rb').read()
    off = layout['payload_offset']
    capacity = layout['payload_len']
    zip_len = os.path.getsize(zip_path)

    if zip_len != capacity:
        raise SystemExit(
            '载荷 %d 字节与预留容量 %d 字节不相等，存根无法定位。\n'
            '请用 --installer 走 build_zip(pad_to=...) 自动补齐。' % (zip_len, capacity)
        )

    with open(out_exe, 'wb') as out, open(zip_path, 'rb') as zf:
        out.write(head)
        shutil.copyfileobj(zf, out, 1024 * 1024)
        out.write(tail)

    size = os.path.getsize(out_exe)
    if size != layout['total_size']:
        raise SystemExit('文件大小 %d 与原始 %d 不一致，头部偏移可能已被破坏'
                         % (size, layout['total_size']))
    log('    载荷 %s，与预留容量完全相等' % human(zip_len))
    log('    生成完成，大小 %s（与原始完全一致，头部偏移未变）' % human(size))
    return size


def verify_installer(exe_path, layout_path):
    log('[4] 校验安装包内嵌载荷')
    layout = json.load(open(layout_path, encoding='utf-8'))
    off = layout['payload_offset']
    lf_off = layout['length_field_offset']
    ok = True
    with open(exe_path, 'rb') as f:
        f.seek(0x3C)
        e_lfanew = struct.unpack('<I', f.read(4))[0]
        f.seek(e_lfanew)
        ok &= check(f.read(4) == b'PE\x00\x00', 'PE 头合法')
        f.seek(lf_off)
        payload_len = struct.unpack('<I', f.read(4))[0]
        ok &= check(0 < payload_len <= layout['payload_len'],
                    '载荷长度字段 = %s（容量 %s）' % (human(payload_len), human(layout['payload_len'])))
        f.seek(off)
        region = f.read(payload_len)
        ok &= check(len(region) == payload_len, '按长度字段截取到完整载荷区')
        ok &= check(region[:4] == b'PK\x03\x04', '载荷起始为 ZIP 本地文件头')
        payload = region

    # 关键：必须像存根一样「按长度字段截取载荷区」再解析。
    # 载荷区之后还有 .NET 元数据与 .rsrc/.reloc，直接把文件尾丢给 zip 解析器
    # 会因为中央目录超出回溯窗口而报 File is not a zip file。
    import io
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as zf:
            names = zf.namelist()
            data = json.loads(zf.read(MANIFEST_REL.replace(os.sep, '/')).decode('utf-8'))
            ok &= check(True, '内嵌载荷可正常解析，共 %d 个条目' % len(names))
            ok &= check(data.get('tag') is not None, '安装后版本号 = %s' % data.get('tag'))
            ok &= check(not [n for n in names if n.startswith('C语言冒险岛/')],
                        '内嵌载荷没有混入开发仓库目录')
            ok &= check(PAD_NAME in names, '占位条目存在（安装时会被 setup.bat 删除）')
    except Exception as e:
        ok &= check(False, '内嵌载荷解析失败：%s' % e)
    return ok


def sync_repo(src, tag):
    log('[5] 同步代码到 git 仓库 payload')
    dst_app = os.path.join(REPO_PAYLOAD, 'resources', 'app')
    src_app = os.path.join(src, 'resources', 'app')
    if not os.path.isdir(src_app):
        log('  [失败] 找不到源目录 ' + src_app)
        return False
    for dirpath, _dirnames, filenames in os.walk(src_app):
        rel = os.path.relpath(dirpath, src_app)
        target_dir = os.path.join(dst_app, rel) if rel != '.' else dst_app
        os.makedirs(target_dir, exist_ok=True)
        for name in filenames:
            shutil.copy2(os.path.join(dirpath, name), os.path.join(target_dir, name))
    # 根目录下会变动的脚本
    for name in ('setup.bat',):
        s = os.path.join(src, name)
        if os.path.exists(s):
            shutil.copy2(s, os.path.join(REPO_PAYLOAD, name))
    # 仓库里记录的是「当前发布版本」
    with open(os.path.join(dst_app, 'version.json'), 'w', encoding='utf-8') as f:
        f.write(manifest_for(tag))
    log('  [通过] 已同步 resources/app 并写入版本 %s' % tag)
    return True


def main():
    ap = argparse.ArgumentParser(description='C语言冒险岛 发布打包')
    ap.add_argument('--tag', required=True, help='发布版本号，例如 v1.0.1')
    ap.add_argument('--source', default=INSTALL_ROOT, help='源目录（安装根目录）')
    ap.add_argument('--out', default=DEFAULT_OUT, help='输出目录')
    ap.add_argument('--installer', action='store_true', help='同时重建桌面安装包 exe')
    ap.add_argument('--installer-include-repo', action='store_true',
                    help='安装包内保留开发仓库目录（默认排除，可大幅减小体积）')
    ap.add_argument('--installer-tag', default=None, help='安装包内记录的版本号，默认同 --tag')
    ap.add_argument('--installer-out', default=None, help='安装包输出路径')
    ap.add_argument('--sfx-template', default=DEFAULT_SFX_TEMPLATE, help='用于提取存根的原始安装包')
    ap.add_argument('--sync-repo', action='store_true', help='把 resources/app 同步进 git 仓库')
    ap.add_argument('--skip-zip', action='store_true', help='跳过 zip 构建')
    args = ap.parse_args()

    src = os.path.abspath(args.source)
    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    log('源目录  : ' + src)
    log('输出目录: ' + out_dir)
    log('目标版本: ' + args.tag)
    log('')

    # 打包前先看一眼源目录的版本号，这正是手动打包最容易忘的地方
    src_manifest = os.path.join(src, MANIFEST_REL)
    if os.path.exists(src_manifest):
        try:
            cur = json.load(open(src_manifest, encoding='utf-8'))
            log('[0] 源目录 version.json = %s' % cur.get('tag'))
            if cur.get('tag') != args.tag:
                log('    [提示] 与目标版本不一致，打包时会自动注入 %s（不会修改源目录）' % args.tag)
        except Exception as e:
            log('[0] 源目录 version.json 解析失败：%s' % e)
    else:
        log('[0] [提示] 源目录没有 version.json，打包时自动注入 %s' % args.tag)
    log('')

    ok = True
    out_zip = os.path.join(out_dir, 'C语言冒险岛%s.zip' % args.tag)
    if not args.skip_zip:
        build_zip(src, args.tag, out_zip, include_repo=False)
        ok &= verify_zip(out_zip, args.tag, expect_repo=False)
        log('    大小 %s' % human(os.path.getsize(out_zip)))
        log('    sha256 %s' % sha256_of(out_zip))
        log('')

    if args.sync_repo:
        ok &= sync_repo(src, args.tag)
        log('')

    if args.installer:
        inst_tag = args.installer_tag or args.tag
        inst_zip = os.path.join(out_dir, '_installer_payload%s.zip' % inst_tag)
        layout = json.load(open(os.path.join(HERE, 'sfx-layout.json'), encoding='utf-8'))
        # 安装包只装游戏本体，不再把开发仓库目录与 .git 一起打进去
        # （原安装包 496MB，其中 256MB 是 .git 松散对象，纯属垃圾）。
        # 载荷必须精确等于存根预留容量，由 pad_zip_to 用占位条目补齐。
        build_zip(src, inst_tag, inst_zip,
                  include_repo=args.installer_include_repo, pad_to=layout['payload_len'])
        if not verify_zip(inst_zip, inst_tag, expect_repo=args.installer_include_repo):
            ok = False
        inst_out = args.installer_out or os.path.join(os.path.dirname(out_dir), 'C语言冒险岛安装包.exe')
        ensure_sfx_parts(args.sfx_template)
        build_installer(inst_zip, inst_out, os.path.join(HERE, 'sfx-layout.json'),
                        os.path.join(HERE, 'sfx-head.bin'), os.path.join(HERE, 'sfx-tail.bin'))
        ok &= verify_installer(inst_out, os.path.join(HERE, 'sfx-layout.json'))
        os.remove(inst_zip)
        log('    sha256 %s' % sha256_of(inst_out))
        log('')

    log('=' * 60)
    log('结论：' + ('全部校验通过' if ok else '存在失败项，请检查上面的 [失败] 行'))
    return 0 if ok else 1


def ensure_sfx_parts(template):
    """如果 tools 下缺少存根分片，就从原安装包里现提一份。"""
    head = os.path.join(HERE, 'sfx-head.bin')
    tail = os.path.join(HERE, 'sfx-tail.bin')
    layout = os.path.join(HERE, 'sfx-layout.json')
    if all(os.path.exists(p) for p in (head, tail, layout)):
        return
    if not os.path.exists(template):
        raise SystemExit('缺少 SFX 存根分片，且找不到原始安装包用于提取：' + template)
    lay = json.load(open(layout, encoding='utf-8'))
    off = lay['payload_offset']
    blob = off + lay['payload_len']
    with open(template, 'rb') as f:
        data = f.read()
    open(head, 'wb').write(data[:off])
    open(tail, 'wb').write(data[blob:])
    log('    已从原安装包提取 SFX 存根分片')


if __name__ == '__main__':
    sys.exit(main())
