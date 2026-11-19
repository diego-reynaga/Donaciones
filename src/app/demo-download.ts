export function downloadDemoFile(name: string, data: string): void {
  const match = /^data:([^;,]+);base64,(.*)$/.exec(data);
  if (!match) {
    window.alert('No se pudo abrir el archivo guardado.');
    return;
  }
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  downloadBlob(name, new Blob([bytes], { type: match[1] }));
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
