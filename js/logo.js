/* AMA at VCU | 3D logo player
   The logo video carries its colour in the top half and its alpha matte in the
   bottom half (built by tools/build_logo.py). A small WebGL shader puts them
   back together every frame, so the logo floats over any background in every
   browser, Safari included. Falls back to the transparent still if WebGL or
   autoplay is not available. */
(() => {
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  const FS = 'precision mediump float;uniform sampler2D t;varying vec2 v;void main(){vec3 c=texture2D(t,vec2(v.x,v.y*.5)).rgb;float a=texture2D(t,vec2(v.x,.5+v.y*.5)).r;gl_FragColor=vec4(c*a,a);}';

  function mount(host, opts) {
    const { src, poster, still } = opts;
    host.classList.add('logo3d');
    const img = document.createElement('img');
    img.src = poster; img.alt = 'AMA at VCU'; img.className = 'logo3d-still'; img.decoding = 'async';
    host.appendChild(img);
    if (still) return;

    const video = document.createElement('video');
    Object.assign(video, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', src });
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true');
    video.className = 'logo3d-src';
    const canvas = document.createElement('canvas');
    canvas.className = 'logo3d-canvas';
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;
    host.appendChild(video); host.appendChild(canvas);

    const sh = (type, srcText) => { const s = gl.createShader(type); gl.shaderSource(s, srcText); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.clearColor(0, 0, 0, 0);

    let ready = false, visible = true, raf = 0;
    const size = () => { canvas.width = video.videoWidth; canvas.height = video.videoHeight / 2; gl.viewport(0, 0, canvas.width, canvas.height); };
    const draw = () => {
      if (!ready || !visible) return;
      if (video.readyState >= 2 && !video.paused) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          if (!host.classList.contains('live')) host.classList.add('live');
        } catch (e) { /* frame not ready yet, try again next frame */ }
      }
      schedule();
    };
    const schedule = () => { if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(draw); else raf = requestAnimationFrame(draw); };
    video.addEventListener('loadedmetadata', size);
    video.addEventListener('playing', () => { ready = true; size(); schedule(); });
    video.addEventListener('error', () => host.classList.remove('live'));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible) { video.play().catch(() => {}); schedule(); } else video.pause(); }, { threshold: 0 }).observe(host);
    }
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    video.addEventListener('canplay', tryPlay, { once: true });
    // strict autoplay policies: start on the first touch, click or key press
    const kick = () => { tryPlay(); ['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.removeEventListener(ev, kick)); };
    ['pointerdown', 'touchstart', 'keydown'].forEach(ev => document.addEventListener(ev, kick, { passive: true }));
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else if (visible) { tryPlay(); schedule(); } });
  }

  window.AMALogo = { mount };
})();
