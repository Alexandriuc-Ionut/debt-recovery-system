export const noticesService = {
  /**
   * Downloads the somație PDF for a given invoice.
   * Returns a Blob that can be used to trigger a browser download.
   */
  async downloadSomatie(invoiceId: number): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/notices/somatie/${invoiceId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to generate notice');
    }
    return res.blob();
  },
};

export function triggerPdfDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
