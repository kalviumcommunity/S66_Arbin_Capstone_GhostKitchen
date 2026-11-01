import api from "../api/api";

export async function downloadFile(path, filename) {
  try {
    const { data } = await api.get(path, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      const content = await error.response.data.text();
      let message;
      try { message = JSON.parse(content).message; } catch { /* Use the generic error for non-JSON responses. */ }
      throw new Error(message || "Unable to download this file.");
    }
    throw error;
  }
}
