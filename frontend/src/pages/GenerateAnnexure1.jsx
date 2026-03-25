import { useState } from "react";
import DashboardLayout from "../Layouts/DashboardLayout";

const GenerateAnnexure1 = () => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const input = (name) => (
    <input
      type="text"
      name={name}
      onChange={handleChange}
      className="w-full border-none outline-none px-2 py-1"
    />
  );

  const tableInput = (name) => (
    <input
      type="text"
      name={name}
      onChange={handleChange}
      className="w-full border border-gray-300 px-2 py-1"
    />
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          ANNEXURE - 1
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-black text-sm">

            <tbody>

              {/* ================= BASIC INFO ================= */}
              <tr className="bg-gray-200 font-semibold">
                <td colSpan="4" className="border p-2">1. Basic Information</td>
              </tr>

              {[
                ["1", "Name of EOSP/EOIP", "projectName"],
                ["2", "Address", "projectAddress"],
                ["3", "Implementing Agency", "implementingAgency"],
                ["4", "Contact Person", "contactPerson"],
              ].map(([no, label, name]) => (
                <tr key={name}>
                  <td className="border p-2 w-10">{no}</td>
                  <td className="border p-2">{label}</td>
                  <td colSpan="2" className="border">{input(name)}</td>
                </tr>
              ))}

              {/* ================= PROJECT DETAILS ================= */}
              <tr className="bg-gray-200 font-semibold">
                <td colSpan="4" className="border p-2">2. Project Details</td>
              </tr>

              {[
                ["5", "Project Title", "projectTitle"],
                ["6", "Facility to be Set Up", "facility"],
                ["7", "Services Offered", "services"],
                ["8", "Impact on Ecosystem", "impact"],
                ["9", "Expected Export Growth", "exportGrowth"],
              ].map(([no, label, name]) => (
                <tr key={name}>
                  <td className="border p-2">{no}</td>
                  <td className="border p-2">{label}</td>
                  <td colSpan="2" className="border">{input(name)}</td>
                </tr>
              ))}

              {/* ================= LAND DETAILS ================= */}
              <tr className="bg-gray-200 font-semibold">
                <td colSpan="4" className="border p-2">3. Land Details</td>
              </tr>

              {[
                ["10", "Total Land Area (Ha)", "landArea"],
                ["11", "Land Status", "landStatus"],
              ].map(([no, label, name]) => (
                <tr key={name}>
                  <td className="border p-2">{no}</td>
                  <td className="border p-2">{label}</td>
                  <td colSpan="2" className="border">{input(name)}</td>
                </tr>
              ))}

              {/* ================= PROJECT COST ================= */}
              <tr className="bg-gray-200 font-semibold">
                <td colSpan="4" className="border p-2">4. Estimated Project Cost (Rs. in Lakhs)</td>
              </tr>

              {[
                ["12", "Land Development", "landDevCost"],
                ["13", "Infrastructure & Building", "infraCost"],
                ["14", "Plant & Machinery", "machineryCost"],
                ["15", "Other Expenditure", "otherCost"],
                ["16", "Total Project Cost", "totalCost"],
              ].map(([no, label, name]) => (
                <tr key={name}>
                  <td className="border p-2">{no}</td>
                  <td className="border p-2">{label}</td>
                  <td colSpan="2" className="border">{input(name)}</td>
                </tr>
              ))}

              {/* ================= MEANS OF FINANCE ================= */}
              <tr className="bg-gray-200 font-semibold">
                <td colSpan="4" className="border p-2">5. Means of Finance</td>
              </tr>

              {[
                ["17", "Promoter Contribution", "promoterContribution"],
                ["18", "Term Loan", "termLoan"],
                ["19", "Subsidy", "subsidy"],
                ["20", "Others", "otherFinance"],
              ].map(([no, label, name]) => (
                <tr key={name}>
                  <td className="border p-2">{no}</td>
                  <td className="border p-2">{label}</td>
                  <td colSpan="2" className="border">{input(name)}</td>
                </tr>
              ))}

            </tbody>
          </table>

          {/* ================= PLANT & MACHINERY TABLE ================= */}
          <h3 className="mt-8 font-semibold">6. Plant & Machinery</h3>
          <table className="w-full border border-black mt-2 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">S.No</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td className="border p-2">{i}</td>
                  <td className="border p-2">{tableInput(`machineryName${i}`)}</td>
                  <td className="border p-2">{tableInput(`machineryQty${i}`)}</td>
                  <td className="border p-2">{tableInput(`machineryCost${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ================= RAW MATERIAL ================= */}
          <h3 className="mt-8 font-semibold">7. Raw Materials</h3>
          <table className="w-full border border-black mt-2 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">S.No</th>
                <th className="border p-2">Material</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td className="border p-2">{i}</td>
                  <td className="border p-2">{tableInput(`rawName${i}`)}</td>
                  <td className="border p-2">{tableInput(`rawQty${i}`)}</td>
                  <td className="border p-2">{tableInput(`rawCost${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ================= MANPOWER ================= */}
          <h3 className="mt-8 font-semibold">8. Manpower</h3>
          <table className="w-full border border-black mt-2 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">S.No</th>
                <th className="border p-2">Category</th>
                <th className="border p-2">No.</th>
                <th className="border p-2">Salary</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td className="border p-2">{i}</td>
                  <td className="border p-2">{tableInput(`manpowerCategory${i}`)}</td>
                  <td className="border p-2">{tableInput(`manpowerNo${i}`)}</td>
                  <td className="border p-2">{tableInput(`manpowerSalary${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default GenerateAnnexure1;