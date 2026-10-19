"""Banda sonora original generada por código (sin muestras ni derechos de terceros)."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
SR = 48000
rng = np.random.default_rng(7)

def T(d): return np.arange(int(d*SR))/SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def saw(f, t, ph=0.0): return 2*((f*t+ph) % 1)-1

def add(buf, x, at, gain=1.0):
    i = int(at*SR)
    if i >= len(buf): return
    if i < 0: x = x[-i:]; i = 0
    x = x[:len(buf)-i]
    buf[i:i+len(x)] += gain*x

def hit(big=False):
    d = 2.6 if big else 1.3
    t = T(d)
    f = 38 + (110 if big else 85)*np.exp(-t/0.05)
    ph = 2*np.pi*np.cumsum(f)/SR
    body = np.sin(ph)*np.exp(-t/(0.9 if big else 0.42))
    sub = np.sin(2*np.pi*31*t)*np.exp(-t/1.3)*(0.8 if big else 0)
    n = rng.standard_normal(len(t))
    crack = lp(n, 2500)*np.exp(-t/0.035)*0.9 + hp(n, 3000)*np.exp(-t/0.012)*0.25
    x = np.tanh(1.8*(body*1.1 + sub + crack))
    return x

def whoosh(d=0.45):
    t = T(d); n = rng.standard_normal(len(t)); out = np.zeros_like(n)
    seg = len(t)//12
    for k in range(12):
        lo = 250*(1.25**k); hi = min(lo*3, 16000)
        s = slice(k*seg, (k+1)*seg if k < 11 else len(t))
        out[s] = bp(n, lo, hi)[s]
    return out*(t/d)**2.2*0.55

def cut():
    t = T(0.18); n = rng.standard_normal(len(t))
    return (hp(n, 1800)*np.exp(-t/0.01)*0.35 + np.sin(2*np.pi*140*t)*np.exp(-t/0.05)*0.4)

def tick(hi=True):
    t = T(0.06); f = 2600 if hi else 1900
    return (np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*f*2.01*t))*np.exp(-t/0.008)*0.5 + hp(rng.standard_normal(len(t)), 4000)*np.exp(-t/0.004)*0.25

def riser(d):
    t = T(d); x = t/d
    f = 140*(18**x)
    s = np.sin(2*np.pi*np.cumsum(f)/SR)*0.35 + np.sin(2*np.pi*np.cumsum(f*1.5)/SR)*0.15
    n = hp(rng.standard_normal(len(t)), 900)*0.35
    return (s + n*x)*(x**2.4)

def drone(d):
    t = T(d)
    x = sum(saw(f, t, rng.random()) for f in (55, 55.35, 54.7, 82.41, 82.8))*0.22 + np.sin(2*np.pi*55*t)*0.5
    x = lp(x, 260, 4)
    lfo = 0.75 + 0.25*np.sin(2*np.pi*0.17*t)
    return x*lfo

def pulse(d, bpm=120):
    t = T(d); out = np.zeros(len(t)); step = 60/bpm/2
    note = T(step*0.95)
    pat = [1, .5, .7, .5, 1, .5, .8, .6]
    for i in range(int(d/step)):
        f = 55 if (i//16) % 4 != 3 else 49
        env = np.exp(-note/0.09)
        raw = saw(f, note) + saw(f*1.005, note); fe = np.exp(-note/0.05)
        p = (lp(raw, 1800)*fe + lp(raw, 180)*(1-fe))*env*pat[i % 8]
        add(out, p, i*step, 0.5)
        if i % 2 == 1:
            add(out, hp(rng.standard_normal(int(0.03*SR)), 7000)*np.exp(-T(0.03)/0.008), i*step, 0.12)
    return out

def chord(d):
    t = T(d); x = np.zeros(len(t))
    for f in (110, 130.81, 164.81, 220, 246.94, 329.63):
        for det in (0.997, 1.0, 1.004):
            x += saw(f*det, t, rng.random())
    cutoff = 300 + 2200*np.exp(-t/1.6)
    seg = SR//20; y = np.zeros_like(x)
    for k in range(0, len(t), seg):
        y[k:k+seg] = lp(x[max(0, k-2000):k+seg], max(cutoff[k], 200))[-len(x[k:k+seg]):]
    env = np.minimum(t/0.03, 1)*np.exp(-t/3.2)
    return y*env*0.09

def reverb(x, secs=2.4, mix=0.25):
    n = int(secs*SR); t = np.arange(n)/SR
    irL = rng.standard_normal(n)*np.exp(-t/0.7); irR = rng.standard_normal(n)*np.exp(-t/0.7)
    irL = lp(irL, 5000); irR = lp(irR, 5000)
    wl = fftconvolve(x, irL)[:len(x)]; wr = fftconvolve(x, irR)[:len(x)]
    s = max(np.abs(wl).max(), 1e-9) / max(np.abs(x).max(), 1e-9)
    return x + mix*wl/s, x + mix*wr/s

def build(events, total, path):
    """events: lista de (tipo, inicio, params)."""
    n = int(total*SR)
    bed = np.zeros(n); fx = np.zeros(n); dry = np.zeros(n)
    duck = np.ones(n)
    for kind, at, p in events:
        if kind == 'drone': add(bed, drone(p['d']) * np.linspace(p.get('g0', .35), p.get('g1', .8), int(p['d']*SR)), at, 0.6)
        elif kind == 'pulse': add(bed, pulse(p['d']), at, p.get('g', 0.9))
        elif kind == 'hit':
            add(fx, hit(p.get('big', False)), at, 0.95 if p.get('big') else 0.75)
            i = int(at*SR); m = min(n-i, int(0.35*SR))
            if m > 0: duck[i:i+m] = np.minimum(duck[i:i+m], 0.35 + 0.65*np.linspace(0, 1, m)**2)
        elif kind == 'whoosh': add(fx, whoosh(p.get('d', 0.45)), at - p.get('d', 0.45), 0.6)
        elif kind == 'cut': add(dry, cut(), at, 0.5)
        elif kind == 'ticks':
            k = 0; tt = at
            while tt < at + p['d']:
                add(dry, tick(k % 2 == 0), tt, 0.55); tt += p.get('every', 0.5); k += 1
        elif kind == 'riser': add(fx, riser(p['d']), at, 0.55)
        elif kind == 'chord': add(fx, chord(p['d']), at, p.get('g', 1.0))
        elif kind == 'silence':
            i = int(at*SR); j = min(n, int((at+p['d'])*SR))
            duck[i:j] = 0.0; bed[i:j] = 0
    bed = bed*duck
    L, R = reverb(fx, 2.6, 0.35)
    bl = bed; br = np.concatenate([np.zeros(int(0.012*SR)), bed])[:n]
    left = bl + L + dry; right = br + R + dry
    st = np.stack([left, right], 1)
    st = np.tanh(st*1.3)/np.tanh(1.3)
    st /= max(np.abs(st).max(), 1e-9); st *= 0.89
    fade = int(0.8*SR); st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(path, SR, (st*32767).astype(np.int16))
