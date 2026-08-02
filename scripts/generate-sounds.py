import math
import struct
import wave
from pathlib import Path

out = Path(__file__).resolve().parents[1] / "sounds"
out.mkdir(exist_ok=True)


def write_wav(path, samples, rate=22050):
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        frames = b"".join(
            struct.pack("<h", max(-32767, min(32767, int(s * 32767)))) for s in samples
        )
        w.writeframes(frames)


def env(i, n, attack=0.01, release=0.08):
    a = int(n * attack)
    r = int(n * release)
    if i < a:
        return i / max(a, 1)
    if i > n - r:
        return max(0.0, (n - i) / max(r, 1))
    return 1.0


def noise(i):
    x = math.sin(i * 12.9898) * 43758.5453
    return (x - math.floor(x)) * 2 - 1


rate = 22050

# Soft UI click
n = int(rate * 0.08)
click = []
for i in range(n):
    t = i / rate
    s = math.sin(2 * math.pi * 1800 * t) * math.exp(-t * 55)
    s += 0.35 * math.sin(2 * math.pi * 900 * t) * math.exp(-t * 40)
    click.append(s * 0.45 * env(i, n, 0.002, 0.35))
write_wav(out / "ui-click.wav", click, rate)

# Window open
n = int(rate * 0.22)
window = []
for i in range(n):
    t = i / rate
    s = math.sin(2 * math.pi * (620 + 480 * t) * t) * math.exp(-t * 12)
    s += 0.25 * noise(i) * math.exp(-t * 18)
    s += 0.2 * math.sin(2 * math.pi * 90 * t) * math.exp(-t * 8)
    window.append(s * 0.5 * env(i, n, 0.01, 0.35))
write_wav(out / "window-open.wav", window, rate)

# Door enter (low creak)
n = int(rate * 0.55)
door = []
for i in range(n):
    t = i / rate
    freq = 140 + 60 * math.sin(2 * math.pi * 2.2 * t) + 40 * t
    s = math.sin(2 * math.pi * freq * t)
    s += 0.45 * math.sin(2 * math.pi * freq * 1.97 * t)
    s += 0.2 * noise(i) * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 3 * t)))
    door.append(s * 0.38 * env(i, n, 0.05, 0.25))
write_wav(out / "door-enter.wav", door, rate)

# Floor creak
n = int(rate * 0.35)
creak = []
for i in range(n):
    t = i / rate
    freq = 220 + 90 * math.sin(2 * math.pi * 3.5 * t) + 30 * math.sin(2 * math.pi * 7 * t)
    s = math.sin(2 * math.pi * freq * t)
    s += 0.55 * noise(i) * math.exp(-t * 4)
    creak.append(s * 0.4 * env(i, n, 0.02, 0.3))
write_wav(out / "floor-creak.wav", creak, rate)

# Exit / soft close
n = int(rate * 0.28)
exit_s = []
for i in range(n):
    t = i / rate
    s = math.sin(2 * math.pi * (180 - 40 * t) * t) * math.exp(-t * 6)
    s += 0.15 * noise(i) * math.exp(-t * 10)
    exit_s.append(s * 0.42 * env(i, n, 0.02, 0.4))
write_wav(out / "door-exit.wav", exit_s, rate)

print("wrote", sorted(p.name for p in out.iterdir()))
