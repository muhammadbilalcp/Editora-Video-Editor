import { AspectRatio, Clip, ColorAdjustments, ChromaKeySettings, TextSettings } from '../types/editor';

export function getCanvasDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 };
    case '16:9':
      return { width: 1920, height: 1080 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '4:5':
      return { width: 1080, height: 1350 };
    default:
      return { width: 1080, height: 1920 };
  }
}

export function buildCssFilterString(color: ColorAdjustments, presetFilter: string): string {
  const parts: string[] = [];

  // Brightness: -100 to 100 => 0% to 200%
  const brightnessVal = 100 + color.brightness;
  parts.push(`brightness(${brightnessVal}%)`);

  // Contrast: -100 to 100 => 0% to 200%
  const contrastVal = 100 + color.contrast;
  parts.push(`contrast(${contrastVal}%)`);

  // Saturation: -100 to 100 => 0% to 200%
  const satVal = 100 + color.saturation;
  parts.push(`saturate(${satVal}%)`);

  if (color.blur > 0) {
    parts.push(`blur(${color.blur}px)`);
  }

  if (color.hueRotate) {
    parts.push(`hue-rotate(${color.hueRotate}deg)`);
  }

  // Presets
  switch (presetFilter) {
    case 'cinematic':
      parts.push('contrast(115%) saturate(120%) sepia(10%)');
      break;
    case 'vintage':
      parts.push('sepia(45%) contrast(90%) brightness(105%)');
      break;
    case 'cyberpunk':
      parts.push('hue-rotate(180deg) saturate(180%) contrast(125%)');
      break;
    case 'bw':
      parts.push('grayscale(100%) contrast(120%)');
      break;
    case 'warm':
      parts.push('sepia(25%) saturate(120%) brightness(105%)');
      break;
    case 'cold':
      parts.push('hue-rotate(200deg) saturate(110%) brightness(95%)');
      break;
    case 'drama':
      parts.push('contrast(140%) saturate(130%) brightness(90%)');
      break;
  }

  return parts.join(' ');
}

export function applyChromaKey(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: ChromaKeySettings
) {
  if (!settings.enabled) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Key color parse (e.g. green: r0 g255 b0)
  let keyR = 0, keyG = 255, keyB = 0;
  if (settings.color === 'blue') {
    keyR = 0; keyG = 0; keyB = 255;
  } else if (settings.color.startsWith('#')) {
    const hex = settings.color.replace('#', '');
    keyR = parseInt(hex.substring(0, 2), 16) || 0;
    keyG = parseInt(hex.substring(2, 4), 16) || 0;
    keyB = parseInt(hex.substring(4, 6), 16) || 0;
  }

  const threshold = (settings.similarity || 0.4) * 255;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      (r - keyR) * (r - keyR) +
      (g - keyG) * (g - keyG) +
      (b - keyB) * (b - keyB)
    );

    if (dist < threshold) {
      data[i + 3] = 0; // Transparent
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function renderAnimatedTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  textSettings: TextSettings,
  elapsedSec: number,
  clipDuration: number
) {
  ctx.save();

  const {
    content,
    fontFamily,
    fontSize,
    textColor,
    gradientText,
    strokeColor,
    strokeWidth,
    shadowColor,
    shadowBlur,
    backgroundColor,
    animation,
    align,
    bold,
    italic,
  } = textSettings;

  let progress = clipDuration > 0 ? elapsedSec / clipDuration : 1;
  progress = Math.min(Math.max(progress, 0), 1);

  // Compute animated text content or transform
  let textToRender = content;
  let opacity = 1;
  let translateY = 0;
  let scale = 1;

  if (animation === 'typewriter') {
    const charCount = Math.floor(content.length * Math.min(progress * 2, 1));
    textToRender = content.substring(0, charCount);
  } else if (animation === 'fade') {
    opacity = Math.min(progress * 4, 1);
  } else if (animation === 'slide-up') {
    translateY = (1 - Math.min(progress * 3, 1)) * 100;
    opacity = Math.min(progress * 3, 1);
  } else if (animation === 'bounce') {
    const bounceProgress = Math.min(progress * 3, 1);
    translateY = Math.sin(bounceProgress * Math.PI * 2) * -30 * (1 - bounceProgress);
  } else if (animation === 'pop' || animation === 'zoom') {
    scale = Math.min(progress * 4, 1);
  }

  ctx.globalAlpha = opacity;
  ctx.translate(canvasWidth / 2, canvasHeight / 2 + translateY);
  ctx.scale(scale, scale);

  const fontStyle = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px '${fontFamily}', sans-serif`;
  ctx.font = fontStyle;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  // Measure text
  const metrics = ctx.measureText(textToRender);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;

  // Background pill
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    const padding = 16;
    let bgX = -textWidth / 2 - padding;
    if (align === 'left') bgX = -padding;
    if (align === 'right') bgX = -textWidth - padding;

    const bgY = -textHeight / 2 - padding / 2;
    ctx.beginPath();
    ctx.roundRect(bgX, bgY, textWidth + padding * 2, textHeight + padding, 12);
    ctx.fill();
  }

  // Shadow
  if (shadowColor && shadowBlur) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
  }

  // Stroke / Outline
  if (strokeColor && strokeWidth) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(textToRender, 0, 0);
  }

  // Fill Gradient or Solid
  if (gradientText && gradientText.enabled) {
    const grad = ctx.createLinearGradient(-textWidth / 2, 0, textWidth / 2, 0);
    grad.addColorStop(0, gradientText.from);
    grad.addColorStop(1, gradientText.to);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = textColor;
  }

  ctx.fillText(textToRender, 0, 0);

  ctx.restore();
}
