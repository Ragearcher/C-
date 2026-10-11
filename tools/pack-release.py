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


def build_zip(src, tag, out_zip, include_repo=False):
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
    return count


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
    log('[3] 重建桌面安装包 ' + out_exe)
    layout = json.load(open(layout_path, encoding='utf-8'))
    head = open(head_path, 'rb').read()
    tail = open(tail_path, 'rb').read()
    payload_len = layout['payload_len']
    zip_len = os.path.getsize(zip_path)
    delta = zip_len - payload_len

    # 载荷起点固定 1948 不变，启动器与 .rsrc/.reloc 整体跟随载荷移动。
    # 这样「载荷结束到文件末尾」的距离始终保持 11954 字节不变 —— 自解压启动器
    # 靠这个尾部结构定位 zip 的中央目录，所以绝不能用补零的方式对齐长度。
    if delta < 0:
        mode = '载荷缩小 %s，尾部整体前移' % human(-delta)
    elif delta > 0:
        mode = '载荷增大 %s，尾部整体后移' % human(delta)
    else:
        mode = '载荷长度不变，无需改动段表'
    log('    载荷 %s -> 原 %s（%s）' % (human(zip_len), human(payload_len), mode))

    with open(out_exe, 'wb') as out, open(zip_path, 'rb') as zf:
        out.write(head)
        shutil.copyfileobj(zf, out, 1024 * 1024)
        out.write(tail)

    if delta != 0:
        patch_section_table(out_exe, delta)

    size = os.path.getsize(out_exe)
    log('    生成完成，大小 %s（原 %s）' % (human(size), human(layout['total_size'])))
    return size


def patch_section_table(exe_path, delta):
    """载荷长度变化后同步修正段表，保证 PE 结构自洽。"""
    with open(exe_path, 'r+b') as f:
        header = bytearray(f.read(4096))
        e_lfanew = struct.unpack_from('<I', header, 0x3C)[0]
        nsec = struct.unpack_from('<H', header, e_lfanew + 6)[0]
        optsz = struct.unpack_from('<H', header, e_lfanew + 20)[0]
        sec_off = e_lfanew + 24 + optsz
        for i in range(nsec):
            o = sec_off + i * 40
            name = bytes(header[o:o + 8]).rstrip(b'\x00').decode('ascii', 'replace')
            vsize, vaddr, rawsize, rawptr = struct.unpack_from('<IIII', header, o + 8)
            if name == '.text':
                struct.pack_into('<IIII', header, o + 8, vsize + delta, vaddr, rawsize + delta, rawptr)
            elif name in ('.rsrc', '.reloc'):
                struct.pack_into('<IIII', header, o + 8, vsize, vaddr, rawsize, rawptr + delta)
        if delta > 0:
            # 段变大时才需要抬高映像大小；缩小时保持不变即可
            so_img = e_lfanew + 24 + 56
            size_of_image = struct.unpack_from('<I', header, so_img)[0]
            align = struct.unpack_from('<I', header, e_lfanew + 24 + 32)[0] or 0x1000
            grow = ((delta + align - 1) // align) * align
            struct.pack_into('<I', header, so_img, size_of_image + grow)
        f.seek(0)
        f.write(header)
    log('    已修正段表（.text / .rsrc / .reloc）')


def verify_installer(exe_path):
    log('[4] 校验安装包内嵌载荷')
    ok = True
    with open(exe_path, 'rb') as f:
        f.seek(0x3C)
        e_lfanew = struct.unpack('<I', f.read(4))[0]
        f.seek(e_lfanew)
        ok &= check(f.read(4) == b'PE\x00\x00', 'PE 头合法')
        f.seek(1948)
        head_bytes = f.read(4)
        ok &= check(head_bytes == b'PK\x03\x04', '载荷起始为 ZIP 本地文件头')
        f.seek(0)
        blob = f.read()
    start = blob.find(b'PK\x03\x04')
    import io
    try:
        with zipfile.ZipFile(io.BytesIO(blob[start:])) as zf:
            names = zf.namelist()
            data = json.loads(zf.read(MANIFEST_REL.replace(os.sep, '/')).decode('utf-8'))
            ok &= check(True, '内嵌载荷可正常解析，共 %d 个条目' % len(names))
            ok &= check(data.get('tag') is not None,
                        '安装后版本号 = %s' % data.get('tag'))
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
        # 安装包只装游戏本体，不再把开发仓库目录与 .git 一起打进去
        # （原安装包 496MB，其中 256MB 是 .git 松散对象，纯属垃圾）
        build_zip(src, inst_tag, inst_zip, include_repo=args.installer_include_repo)
        if not verify_zip(inst_zip, inst_tag, expect_repo=args.installer_include_repo):
            ok = False
        inst_out = args.installer_out or os.path.join(os.path.dirname(out_dir), 'C语言冒险岛安装包.exe')
        ensure_sfx_parts(args.sfx_template)
        build_installer(inst_zip, inst_out, os.path.join(HERE, 'sfx-layout.json'),
                        os.path.join(HERE, 'sfx-head.bin'), os.path.join(HERE, 'sfx-tail.bin'))
        ok &= verify_installer(inst_out)
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
