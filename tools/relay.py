#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
砚池 · 局域网中转服务（relay）

这是一个通用的 WebSocket 消息中转器：把任一设备发来的消息，
原样广播给同一房间里的其他设备。砚池会在消息里带上自己的
命名空间（默认 yanchi-vault），只认领属于自己的消息，因此
它也能和任意其它中转服务搭配使用。

使用：
    pip install websockets
    python tools/relay.py

然后在砚池「设置 → 局域网同步」填入：
    ws://<运行本脚本的电脑局域网 IP>:8765
"""
import asyncio
import socket
import sys

PORT = 8765

try:
    import websockets
except ImportError:
    print()
    print("    中转服务还缺一个小部件。请先运行：")
    print("        pip install websockets")
    print("    安装完成后再次运行本脚本即可。")
    print()
    sys.exit(1)


def lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"


clients = set()


async def handler(ws):
    clients.add(ws)
    try:
        peer = getattr(ws, "remote_address", ("?", 0))
        print(f"    · 设备接入：{peer[0]}:{peer[1]}（当前 {len(clients)} 台在线）")
        async for message in ws:
            # 原样广播给其他设备；砚池会按命名空间自行过滤
            for other in list(clients):
                if other is not ws:
                    try:
                        await other.send(message)
                    except Exception:
                        pass
    except websockets.ConnectionClosed:
        pass
    finally:
        clients.discard(ws)
        print(f"    · 设备离开（当前 {len(clients)} 台在线）")


async def main():
    ip = lan_ip()
    print()
    print("    ┌────────────────────────────────────────┐")
    print("    │    砚池 · 局域网中转服务已启动          │")
    print("    └────────────────────────────────────────┘")
    print()
    print(f"    本机访问：ws://localhost:{PORT}")
    print(f"    局域网内其他设备请填写：ws://{ip}:{PORT}")
    print()
    print("    · 消息会被原样广播，砚池按命名空间 yanchi-vault 过滤")
    print("    · 想停止时按 Ctrl + C")
    print()
    async with websockets.serve(handler, "0.0.0.0", PORT):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n    中转服务已停止。")
