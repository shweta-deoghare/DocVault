import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import API from "../api/API";

const ImportExcel = ({ setFormData, bulk = false }) => {
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      if (jsonData.length === 0) return;

      // ✅ BULK MODE (for UserManagement page)
      if (bulk) {
        try {
          await API.post("/master-sheet/bulk-create", jsonData);
          alert(`${jsonData.length} clients created successfully`);
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert("Bulk upload failed");
        }
      }

      // ✅ SINGLE MODE (for GenerateMasterSheet page)
      else {
        setFormData((prev) => ({
          ...prev,
          ...jsonData[0],
        }));
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition shadow-sm">
        <Upload size={16} />
        Upload Excel
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>

      {fileName && (
        <span className="text-xs text-gray-600 truncate max-w-[180px]">
          {fileName}
        </span>
      )}
    </div>
  );
};

export default ImportExcel;