(() => {
  const canvas = document.querySelector('#maskLabCanvas');
  const maskThumb = document.querySelector('#maskThumbnail');
  const instruction = document.querySelector('#maskInstruction');
  const status = document.querySelector('#maskLabStatus');

  if (!canvas || !maskThumb || !instruction || !status) return;

  const ctx = canvas.getContext('2d');
  const thumbCtx = maskThumb.getContext('2d');
  const paintMask = document.createElement('canvas');
  const paintCtx = paintMask.getContext('2d');
  const subjectLayer = document.createElement('canvas');
  const subjectCtx = subjectLayer.getContext('2d');
  const selectionOverlay = document.createElement('canvas');
  const selectionCtx = selectionOverlay.getContext('2d');
  const selectionEdge = document.createElement('canvas');
  const selectionEdgeCtx = selectionEdge.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;
  const subjectBox = { x: 350, y: 115, width: 440, height: 294 };
  const screenBox = { x: 407, y: 80, width: 201, height: 442, radius: 24 };

  for (const layer of [paintMask, subjectLayer]) {
    layer.width = width;
    layer.height = height;
  }

  const images = {
    phone: loadImage('assets/01-phone-base.png'),
    forest: loadImage('assets/02-forest-insert.png'),
    source: loadImage('assets/03-butterfly-source.png'),
    cutout: loadImage('assets/butterfly-cutout-demo.png')
  };

  const stages = {
    source: {
      label: '1 · Source layer',
      text: 'The butterfly arrives as a rectangular layer. Its gray background is still real image content, so it covers the phone.'
    },
    selection: {
      label: '2 · Select Subject',
      text: 'Select Subject identifies the butterfly pixels. The cyan overlay and moving-style edge show the selected area; nothing has been hidden yet.'
    },
    mask: {
      label: '3 · Add layer mask',
      text: 'The selection becomes a mask: white keeps the butterfly visible and black conceals the gray background. The source pixels still exist.'
    },
    paint: {
      label: '4 · Paint the mask',
      text: 'Choose Hide, then drag across a small wing edge where it meets the bezel. Watch the artwork and the mask thumbnail change together. Choose Reveal to repair it.'
    },
    layers: {
      label: '5 · Test layer order',
      text: 'Use the eye checkboxes and move the butterfly below the base. Higher layers cover lower layers; masks decide which parts of a layer remain visible.'
    }
  };

  const state = {
    stage: 'source',
    brush: 'hide',
    brushSize: 34,
    painting: false,
    butterflyVisible: true,
    typeVisible: true,
    forestVisible: true,
    baseVisible: true,
    butterflyOnTop: true
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load ${src}`));
      image.src = src;
    });
  }

  function resetPaintMask() {
    paintCtx.save();
    paintCtx.globalCompositeOperation = 'source-over';
    paintCtx.fillStyle = '#fff';
    paintCtx.fillRect(0, 0, width, height);
    paintCtx.restore();
  }

  function roundRectPath(targetCtx, box) {
    targetCtx.beginPath();
    targetCtx.roundRect(box.x, box.y, box.width, box.height, box.radius);
  }

  function drawImageCover(targetCtx, image, box) {
    const sourceRatio = image.width / image.height;
    const targetRatio = box.width / box.height;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceRatio > targetRatio) {
      sw = image.height * targetRatio;
      sx = (image.width - sw) / 2;
    } else {
      sh = image.width / targetRatio;
      sy = (image.height - sh) / 2;
    }

    targetCtx.drawImage(image, sx, sy, sw, sh, box.x, box.y, box.width, box.height);
  }

  function buildSelectionVisuals(cutout) {
    selectionOverlay.width = cutout.width;
    selectionOverlay.height = cutout.height;
    selectionEdge.width = cutout.width;
    selectionEdge.height = cutout.height;

    selectionCtx.clearRect(0, 0, cutout.width, cutout.height);
    selectionCtx.fillStyle = '#5ee7f2';
    selectionCtx.fillRect(0, 0, cutout.width, cutout.height);
    selectionCtx.globalCompositeOperation = 'destination-in';
    selectionCtx.drawImage(cutout, 0, 0);
    selectionCtx.globalCompositeOperation = 'source-over';

    const alphaCanvas = document.createElement('canvas');
    alphaCanvas.width = cutout.width;
    alphaCanvas.height = cutout.height;
    const alphaCtx = alphaCanvas.getContext('2d', { willReadFrequently: true });
    alphaCtx.drawImage(cutout, 0, 0);
    const source = alphaCtx.getImageData(0, 0, cutout.width, cutout.height);
    const edge = selectionEdgeCtx.createImageData(cutout.width, cutout.height);
    const stride = cutout.width;

    for (let y = 1; y < cutout.height - 1; y += 1) {
      for (let x = 1; x < cutout.width - 1; x += 1) {
        const pixel = (y * stride + x) * 4;
        if (source.data[pixel + 3] < 90) continue;
        const neighbours = [pixel - 4, pixel + 4, pixel - stride * 4, pixel + stride * 4];
        if (!neighbours.some(index => source.data[index + 3] < 90)) continue;
        const light = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
        edge.data[pixel] = light ? 255 : 15;
        edge.data[pixel + 1] = light ? 255 : 15;
        edge.data[pixel + 2] = light ? 255 : 15;
        edge.data[pixel + 3] = 255;
      }
    }

    selectionEdgeCtx.putImageData(edge, 0, 0);
  }

  function drawBase(phone, forest) {
    if (state.baseVisible) {
      ctx.drawImage(phone, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#4b4e51';
      ctx.fillRect(0, 0, width, height);
    }

    if (state.forestVisible) {
      ctx.save();
      roundRectPath(ctx, screenBox);
      ctx.clip();
      drawImageCover(ctx, forest, screenBox);
      ctx.restore();
    }

    if (state.typeVisible) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = '900 56px system-ui, sans-serif';
      ctx.fillText('STEP OUTSIDE', 54, 292);
      ctx.fillStyle = '#b8ff4d';
      ctx.fillRect(55, 328, 102, 5);
      ctx.fillStyle = '#fff';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText('One screen can open another world.', 55, 372);
      ctx.restore();
    }
  }

  function drawSubject(cutout, usePaintMask = true) {
    subjectCtx.clearRect(0, 0, width, height);
    subjectCtx.globalCompositeOperation = 'source-over';
    subjectCtx.drawImage(cutout, subjectBox.x, subjectBox.y, subjectBox.width, subjectBox.height);
    if (usePaintMask) {
      subjectCtx.globalCompositeOperation = 'destination-in';
      subjectCtx.drawImage(paintMask, 0, 0);
      subjectCtx.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.filter = 'drop-shadow(0 8px 6px rgba(0,0,0,.45))';
    ctx.drawImage(subjectLayer, 0, 0);
    ctx.restore();
  }

  function drawMaskThumbnail(cutout) {
    thumbCtx.fillStyle = '#050505';
    thumbCtx.fillRect(0, 0, maskThumb.width, maskThumb.height);

    if (state.stage === 'source' || state.stage === 'selection') {
      thumbCtx.fillStyle = '#bbb';
      thumbCtx.font = '700 15px system-ui, sans-serif';
      thumbCtx.textAlign = 'center';
      thumbCtx.fillText('NO MASK YET', maskThumb.width / 2, maskThumb.height / 2 + 5);
      return;
    }

    const effective = document.createElement('canvas');
    effective.width = width;
    effective.height = height;
    const effectiveCtx = effective.getContext('2d');
    effectiveCtx.drawImage(cutout, subjectBox.x, subjectBox.y, subjectBox.width, subjectBox.height);
    effectiveCtx.globalCompositeOperation = 'source-in';
    effectiveCtx.fillStyle = '#fff';
    effectiveCtx.fillRect(0, 0, width, height);
    effectiveCtx.globalCompositeOperation = 'destination-in';
    effectiveCtx.drawImage(paintMask, 0, 0);
    effectiveCtx.globalCompositeOperation = 'source-over';
    thumbCtx.drawImage(effective, 0, 0, width, height, 0, 0, maskThumb.width, maskThumb.height);
  }

  function render([phone, forest, source, cutout]) {
    ctx.clearRect(0, 0, width, height);

    if (state.stage === 'source') {
      drawBase(phone, forest);
      if (state.butterflyVisible) ctx.drawImage(source, subjectBox.x, subjectBox.y, subjectBox.width, subjectBox.height);
    } else if (state.stage === 'selection') {
      drawBase(phone, forest);
      if (state.butterflyVisible) {
        ctx.drawImage(source, subjectBox.x, subjectBox.y, subjectBox.width, subjectBox.height);
        ctx.save();
        ctx.globalAlpha = 0.42;
        ctx.drawImage(selectionOverlay, subjectBox.x, subjectBox.y, subjectBox.width, subjectBox.height);
        ctx.restore();
        ctx.drawImage(selectionEdge, subjectBox.x, subjectBox.y, subjectBox.width, subjectBox.height);
      }
    } else if (state.stage === 'layers' && !state.butterflyOnTop) {
      if (state.butterflyVisible) drawSubject(cutout);
      drawBase(phone, forest);
    } else {
      drawBase(phone, forest);
      if (state.butterflyVisible) drawSubject(cutout);
    }

    drawMaskThumbnail(cutout);
  }

  function updateInterface(imageList) {
    const current = stages[state.stage];
    instruction.textContent = current.text;
    status.textContent = current.label;
    document.querySelectorAll('[data-mask-stage]').forEach(button => {
      const active = button.dataset.maskStage === state.stage;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
    });
    document.querySelector('#maskBrushControls').hidden = state.stage !== 'paint';
    document.querySelector('#layerExperiment').hidden = state.stage !== 'layers';
    render(imageList);
  }

  function paintAt(event, imageList) {
    if (!state.painting || state.stage !== 'paint') return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (width / bounds.width);
    const y = (event.clientY - bounds.top) * (height / bounds.height);
    paintCtx.save();
    paintCtx.globalCompositeOperation = 'source-over';
    paintCtx.fillStyle = state.brush === 'hide' ? '#000' : '#fff';
    paintCtx.beginPath();
    paintCtx.arc(x, y, state.brushSize, 0, Math.PI * 2);
    paintCtx.fill();
    paintCtx.restore();
    render(imageList);
  }

  Promise.all(Object.values(images)).then(imageList => {
    buildSelectionVisuals(imageList[3]);
    resetPaintMask();
    updateInterface(imageList);

    document.querySelectorAll('[data-mask-stage]').forEach(button => {
      button.addEventListener('click', () => {
        state.stage = button.dataset.maskStage;
        updateInterface(imageList);
      });
    });

    document.querySelectorAll('[data-mask-brush]').forEach(button => {
      button.addEventListener('click', () => {
        state.brush = button.dataset.maskBrush;
        document.querySelectorAll('[data-mask-brush]').forEach(option => {
          option.setAttribute('aria-pressed', String(option === button));
        });
      });
    });

    document.querySelector('#maskBrushSize').addEventListener('input', event => {
      state.brushSize = Number(event.target.value);
      document.querySelector('#brushSizeValue').textContent = `${state.brushSize}px`;
    });

    document.querySelector('#resetMask').addEventListener('click', () => {
      resetPaintMask();
      render(imageList);
      instruction.textContent = 'Mask reset. Choose Hide and paint a small overlap; switch to Reveal to repair it.';
    });

    const visibilityMap = {
      labButterfly: 'butterflyVisible',
      labType: 'typeVisible',
      labForest: 'forestVisible',
      labBase: 'baseVisible'
    };

    Object.entries(visibilityMap).forEach(([id, key]) => {
      document.querySelector(`#${id}`).addEventListener('change', event => {
        state[key] = event.target.checked;
        render(imageList);
      });
    });

    document.querySelector('#changeLayerOrder').addEventListener('click', event => {
      state.butterflyOnTop = !state.butterflyOnTop;
      event.currentTarget.textContent = state.butterflyOnTop ? 'Move Butterfly below Base' : 'Move Butterfly back to top';
      const row = document.querySelector('#butterflyLayerRow');
      const typeRow = document.querySelector('#labType').closest('.lab-layer');
      const orderButton = document.querySelector('#changeLayerOrder');
      row.classList.toggle('below', !state.butterflyOnTop);
      row.querySelector('small').textContent = state.butterflyOnTop ? 'top' : 'below Base';
      if (state.butterflyOnTop) {
        typeRow.parentElement.insertBefore(row, typeRow);
      } else {
        orderButton.parentElement.insertBefore(row, orderButton);
      }
      render(imageList);
    });

    canvas.addEventListener('pointerdown', event => {
      if (state.stage !== 'paint') return;
      state.painting = true;
      canvas.setPointerCapture(event.pointerId);
      paintAt(event, imageList);
    });
    canvas.addEventListener('pointermove', event => paintAt(event, imageList));
    canvas.addEventListener('pointerup', () => { state.painting = false; });
    canvas.addEventListener('pointercancel', () => { state.painting = false; });
  }).catch(error => {
    status.textContent = 'Simulator unavailable';
    instruction.textContent = 'One or more lesson images could not load. Refresh the page or use the bundled files directly.';
    console.error(error);
  });
})();
