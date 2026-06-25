import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { ToastProvider } from "@/shared/components/ToastProvider";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Dashboard } from "@/routes/Dashboard";
import { Merge } from "@/routes/Merge";
import { Split } from "@/routes/Split";
import { Compress } from "@/routes/Compress";
import { Rotate } from "@/routes/Rotate";
import { ImageToPdf } from "@/routes/ImageToPdf";
import { PdfToImages } from "@/routes/PdfToImages";
import { Watermark } from "@/routes/Watermark";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="merge" element={<Merge />} />
              <Route path="split" element={<Split />} />
              <Route path="compress" element={<Compress />} />
              <Route path="rotate" element={<Rotate />} />
              <Route path="image-to-pdf" element={<ImageToPdf />} />
              <Route path="pdf-to-images" element={<PdfToImages />} />
              <Route path="watermark" element={<Watermark />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
