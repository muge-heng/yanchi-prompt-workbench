#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
砚池 · 本地启动器
运行方式：python launcher.py
它只做三件事：启动一个安静的本地服务 → 自动打开浏览器 → 在窗口里陪着你。
无需安装任何依赖，仅使用 Python 自带的标准库。
"""
import http.server
import socketserver
import threading
import webbrowser
import os
import sys
import socket

PORT_START = 8765
PORT_END = 8775
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):  # 保持控制台安静
        pass


def find_free_port():
    for port in range(PORT_START, PORT_END):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", port))
                return port
            except OSError:
                continue
    return None


def main():
    print()
    print("    ┌────────────────────────────────────────┐")
    print("    │                                        │")
    print("    │     砚 池 · 私人提示词工作台            │")
    print("    │                                        │")
    print("    └────────────────────────────────────────┘")
    print()

    if not os.path.isdir(DIST):
        print("    应用文件还没有准备好。")
        print("    请先在项目目录里运行一次构建命令：npm run build")
        print("    （高级信息：启动器找不到 dist 目录）")
        input("\n    按回车键退出…")
        return

    port = find_free_port()
    if port is None:
        print("    本地的几个常用端口都被占用了。")
        print("    可以关掉一些其他程序后再试一次。")
        input("\n    按回车键退出…")
        return

    os.chdir(DIST)
    try:
        httpd = socketserver.ThreadingTCPServer(("0.0.0.0", port), QuietHandler)
    except OSError:
        print("    本地启动组件尚未准备好，请重新运行启动器。")
        input("\n    按回车键退出…")
        return

    url = f"http://localhost:{port}"
    print(f"    本地服务运行中：{url}")
    print("    正在为你打开浏览器…")
    print()
    print("    · 数据保存在你的浏览器本机，不会上传")
    print("    · 局域网内其他设备可通过本机 IP 访问：")
    try:
        ip = socket.gethostbyname(socket.gethostname())
        print(f"      http://{ip}:{port}")
    except Exception:
        pass
    print()
    print("    想离开时，按 Ctrl + C 即可，数据不会丢失。")
    print()

    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n    已安全退出。你的提示词仍然留在本机浏览器里。")
        httpd.shutdown()


if __name__ == "__main__":
    main()
