import { useState, useMemo } from "react";
import DashboardLayout from "../Layouts/DashboardLayout";
import { FileDown, Trash2 } from "lucide-react";

const GenerateAnnexure2 = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    location: "",
    installedCapacity: "",
    product: "",
    technology: "",
    electricity: "",
    water: "",
    fuel: "",
  });

  const [machinery, setMachinery] = useState([
    { name: "", qty: "", unitCost: "", totalCost: 0 },
  ]);

  const [manpower, setManpower] = useState([
    { category: "", persons: "", salary: "", annualCost: 0 },
  ]);

  /* ------------------ GENERAL ------------------ */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ------------------ MACHINERY ------------------ */
  const addMachineryRow = () => {
    setMachinery([...machinery, { name: "", qty: "", unitCost: "", totalCost: 0 }]);
  };

  const deleteMachineryRow = (index) => {
    const updated = machinery.filter((_, i) => i !== index);
    setMachinery(updated);
  };

  const handleMachineryChange = (index, field, value) => {
    const updated = [...machinery];
    updated[index][field] = value;

    const qty = parseFloat(updated[index].qty) || 0;
    const unit = parseFloat(updated[index].unitCost) || 0;
    updated[index].totalCost = qty * unit;

    setMachinery(updated);
  };

  const grandTotalMachinery = useMemo(() => {
    return machinery.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [machinery]);

  /* ------------------ MANPOWER ------------------ */
  const addManpowerRow = () => {
    setManpower([...manpower, { category: "", persons: "", salary: "", annualCost: 0 }]);
  };

  const deleteManpowerRow = (index) => {
    const updated = manpower.filter((_, i) => i !== index);
    setManpower(updated);
  };

  const handleManpowerChange = (index, field, value) => {
    const updated = [...manpower];
    updated[index][field] = value;

    const persons = parseFloat(updated[index].persons) || 0;
    const salary = parseFloat(updated[index].salary) || 0;
    updated[index].annualCost = persons * salary * 12;

    setManpower(updated);
  };

  const totalAnnualManpowerCost = useMemo(() => {
    return manpower.reduce((sum, item) => sum + (item.annualCost || 0), 0);
  }, [manpower]);

  /* ------------------ EXPORT DATA ------------------ */
  const handleGenerate = () => {
    const finalData = {
      generalInfo: formData,
      machinery,
      grandTotalMachinery,
      manpower,
      totalAnnualManpowerCost,
    };

    console.log("Annexure 2 Data:", finalData);

    // Later connect to backend here
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="bg-white border rounded-2xl shadow-sm mb-10">
          <div className="px-6 py-6">
            <h2 className="text-3xl font-bold text-blue-800">
              Annexure 2
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Plant, Machinery & Manpower Details
            </p>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-700 to-blue-500 rounded-b-2xl"></div>
        </div>

        {/* General Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            General Information
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                type="text"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                placeholder={key.replace(/([A-Z])/g, " $1")}
                className="border rounded-lg px-4 py-2"
              />
            ))}
          </div>
        </div>

        {/* Machinery */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            Plant & Machinery
          </h3>

          <table className="w-full border text-sm">
            <thead className="bg-blue-100">
              <tr>
                <th className="border p-2">Machine</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Unit Cost</th>
                <th className="border p-2">Total Cost</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {machinery.map((row, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        handleMachineryChange(i, "name", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) =>
                        handleMachineryChange(i, "qty", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={row.unitCost}
                      onChange={(e) =>
                        handleMachineryChange(i, "unitCost", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2 font-medium">
                    {row.totalCost}
                  </td>
                  <td className="border p-2 text-center">
                    <button onClick={() => deleteMachineryRow(i)}>
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <button
              onClick={addMachineryRow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Row
            </button>

            <div className="font-semibold text-lg text-blue-800">
              Grand Total: ₹ {grandTotalMachinery}
            </div>
          </div>
        </div>

        {/* Manpower */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            Manpower Requirement
          </h3>

          <table className="w-full border text-sm">
            <thead className="bg-blue-100">
              <tr>
                <th className="border p-2">Category</th>
                <th className="border p-2">Persons</th>
                <th className="border p-2">Monthly Salary</th>
                <th className="border p-2">Annual Cost</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {manpower.map((row, i) => (
                <tr key={i}>
                  <td className="border p-2">
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) =>
                        handleManpowerChange(i, "category", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={row.persons}
                      onChange={(e) =>
                        handleManpowerChange(i, "persons", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      value={row.salary}
                      onChange={(e) =>
                        handleManpowerChange(i, "salary", e.target.value)
                      }
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2 font-medium">
                    {row.annualCost}
                  </td>
                  <td className="border p-2 text-center">
                    <button onClick={() => deleteManpowerRow(i)}>
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <button
              onClick={addManpowerRow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Row
            </button>

            <div className="font-semibold text-lg text-blue-800">
              Total Annual Cost: ₹ {totalAnnualManpowerCost}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center mt-10">
          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-md flex items-center gap-2 mx-auto"
          >
            <FileDown size={18} />
            Generate Annexure 2
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default GenerateAnnexure2;