import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../Layouts/DashboardLayout";
import API from "../api/API";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

const Annexure2 = () => {
  const { userId } = useParams();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  /* ================= AUTO FETCH MASTER SHEET ================= */

  useEffect(() => {
    const fetchMasterData = async () => {
      if (!userId) return;
      try {
        const res = await API.get(`/master-sheet/${userId}`);
        const user = res.data;

        setFormData((prev) => ({
          ...prev,
          projectName: user.companyName || "",
          projectLocation: user.factoryAddress || "",
          implementingOrg: user.companyName || "",
          implementingAddress: user.registeredAddress || "",
          agencyStatus: user.msmeType || "",
        }));
      } catch (err) {
        console.error("Master sheet fetch failed", err);
      }
    };
    fetchMasterData();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const Section = ({ title, children }) => (
    <div className="bg-white border rounded-2xl shadow-sm mb-8 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3">
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      <div className="p-6 grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const Input = ({ label, name }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2"
      />
    </div>
  );

  const TextArea = ({ label, name }) => (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea
        rows={4}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
        className="w-full border rounded-lg px-4 py-2"
      />
    </div>
  );

  const tableInput = (name) => (
    <input
      name={name}
      value={formData[name] || ""}
      onChange={handleChange}
      className="w-full outline-none px-2 py-1"
    />
  );const handleExcelImport = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    if (jsonData.length > 0) {
      const excelData = jsonData[0];

      setFormData((prev) => {
        const mergedData = { ...prev };

        Object.keys(excelData).forEach((key) => {
          // ✅ Only fill if field is EMPTY
          if (!prev[key] || prev[key] === "") {
            mergedData[key] = excelData[key];
          }
        });

        return mergedData;
      });
    }
  };

  reader.readAsArrayBuffer(file);
};
const handleGenerate = async (type) => {
  try {
    setLoading(true);

    const response = await fetch(
      `http://localhost:5000/api/annexure2/${type}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const result = await response.json();

    if (response.ok) {
      window.open(
        `http://localhost:5000/api/annexure2/download/${result.fileName}`,
        "_blank"
      );
    } else {
      alert("Generation failed");
    }

  } catch (error) {
    console.error(error);
    alert("Server error");
  } finally {
    setLoading(false);
  }
};
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
{/* HEADER */}
<div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-10">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 py-6">
    <div>
      <h2 className="text-3xl font-bold text-blue-800">
        Annexure II – Detailed Project Report
      </h2>
      <p className="text-sm text-gray-600 mt-1">
        Fill the Annexure II form and export in required format
      </p>
    </div>

    {/* GREEN UPLOAD BUTTON */}
    <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl cursor-pointer shadow-md transition">
      <Upload size={16} />
      <span>Upload Excel</span>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleExcelImport}
        className="hidden"
      />
    </label>
  </div>

  {/* FULL WIDTH BLUE UNDERLINE */}
  <div className="h-1 bg-gradient-to-r from-blue-700 to-blue-500 rounded-b-2xl"></div>
</div>
        {/* ================= A SECTIONS ================= */}

        <Section title="A1. Basic Information">
          <Input label="Project Name" name="projectName" />
          <Input label="Project Location" name="projectLocation" />
          <Input label="Implementing Organization" name="implementingOrg" />
          <Input label="Complete Address" name="implementingAddress" />
          <Input label="Agency Status" name="agencyStatus" />
        </Section>

        <Section title="A2. Project Overview">
          <Input label="Total Cost of Project" name="totalCost" />
          <TextArea label="Financing Pattern" name="financingPattern" />
          <TextArea label="Finance Tied Up" name="financeTiedUp" />
          <TextArea label="Land Availability Details" name="landAvailability" />
          <TextArea label="Project Phasing & Completion Date" name="projectPhasing" />
        </Section>

        <Section title="A3. Scope of Work">
          <TextArea label="Scope of Work" name="scopeOfWork" />
          <TextArea label="Main Benefits" name="mainBenefits" />
          <TextArea label="Existing Investment" name="existingInvestment" />
        </Section>

        <Section title="A4. Detailed Analysis">
          <TextArea label="Identified Critical Gaps for Export" name="criticalGaps" />
          <TextArea label="Possible Solutions" name="solutions" />
          <TextArea label="National & International Benchmarking" name="benchmarking" />
          <TextArea label="Relevant Data & Metrics" name="dataMetrics" />
          <TextArea label="Current Scenario" name="currentScenario" />
          <TextArea label="Human Resource" name="humanResource" />
          <TextArea label="Natural Resources" name="naturalResources" />
          <TextArea label="Raw Material Support" name="rawMaterial" />
          <TextArea label="Resource Organizations" name="resourceOrg" />
          <TextArea label="Academic & Research Support" name="academicSupport" />
          <TextArea label="Connectivity" name="connectivity" />
          <TextArea label="Geographical Advantage" name="geoAdvantage" />
        </Section>

        <Section title="A5. Expected Outcomes">
          <TextArea label="Existing Export & Measurable Outcome" name="exportOutcome" />
          <Input label="Employment Generation" name="employmentGeneration" />
          <Input label="Attracting Investments" name="investmentAttraction" />
          <TextArea label="Value Addition in Product" name="valueAddition" />
          <TextArea label="Export Projection (5 Years)" name="exportProjection" />
          <TextArea label="Reduction in Logistics Cost" name="logisticsReduction" />
          <TextArea label="Impact on Women" name="impactWomen" />
          <TextArea label="Environment Protection Measures" name="environmentProtection" />
        </Section>

        <Section title="A6. Operation & Maintenance">
          <TextArea label="Project Timeline" name="timelineChart" />
          <TextArea label="Sustainability Plan" name="sustainabilityPlan" />
          <TextArea label="User Charges / Fees" name="userCharges" />
        </Section>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            B(a)(i) List of Plant & Machinery
          </h3>

          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Sr No</th>
                <th className="border p-2">Particular</th>
                <th className="border p-2">Number</th>
                <th className="border p-2">Power (HP/KW)</th>
                <th className="border p-2">F.O.R Price</th>
                <th className="border p-2">Supplier</th>
                <th className="border p-2">Delivery Schedule</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2">{tableInput(`pm_particular_${i}`)}</td>
                  <td className="border p-2">{tableInput(`pm_no_${i}`)}</td>
                  <td className="border p-2">{tableInput(`pm_power_${i}`)}</td>
                  <td className="border p-2">{tableInput(`pm_price_${i}`)}</td>
                  <td className="border p-2">{tableInput(`pm_supplier_${i}`)}</td>
                  <td className="border p-2">{tableInput(`pm_delivery_${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Raw Material Table */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            B(b) Raw Material Requirement (100% Capacity)
          </h3>

          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Sr No</th>
                <th className="border p-2">Particular</th>
                <th className="border p-2">Specification</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Unit Price</th>
                <th className="border p-2">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2">{tableInput(`rm_particular_${i}`)}</td>
                  <td className="border p-2">{tableInput(`rm_spec_${i}`)}</td>
                  <td className="border p-2">{tableInput(`rm_qty_${i}`)}</td>
                  <td className="border p-2">{tableInput(`rm_price_${i}`)}</td>
                  <td className="border p-2">{tableInput(`rm_total_${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Organizational Setup */}
        {/* ================= B(c)(i) Power for Industrial Purposes ================= */}

<div className="bg-white rounded-xl shadow p-6 mb-8">
  <h3 className="text-lg font-bold text-blue-800 mb-4">
    B(c)(i) Power for Industrial Purposes
  </h3>

  <table className="min-w-full border text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="border p-2">Sr No</th>
        <th className="border p-2">Particulars of Machinery</th>
        <th className="border p-2">KW</th>
        <th className="border p-2">Working Hours / Month</th>
        <th className="border p-2">KW / Month</th>
        <th className="border p-2">INR / KWH</th>
        <th className="border p-2">Total (INR)</th>
      </tr>
    </thead>
    <tbody>
      {[...Array(5)].map((_, i) => (
        <tr key={i}>
          <td className="border p-2 text-center">{i + 1}</td>
          <td className="border p-2">{tableInput(`power_machine_${i}`)}</td>
          <td className="border p-2">{tableInput(`power_kw_${i}`)}</td>
          <td className="border p-2">{tableInput(`power_hours_${i}`)}</td>
          <td className="border p-2">{tableInput(`power_kwmonth_${i}`)}</td>
          <td className="border p-2">{tableInput(`power_rate_${i}`)}</td>
          <td className="border p-2">{tableInput(`power_total_${i}`)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        {/* ================= B(d) Site Development ================= */}

<div className="bg-white rounded-xl shadow p-6 mb-8">
  <h3 className="text-lg font-bold text-blue-800 mb-4">
    B(d) Site Development & Civil Construction
  </h3>

  <table className="min-w-full border text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="border p-2">Sr No</th>
        <th className="border p-2">Particulars</th>
        <th className="border p-2">Quantity / Nos</th>
        <th className="border p-2">Rate (INR)</th>
        <th className="border p-2">Cost (INR)</th>
      </tr>
    </thead>
    <tbody>
      {[...Array(6)].map((_, i) => (
        <tr key={i}>
          <td className="border p-2 text-center">{i + 1}</td>
          <td className="border p-2">{tableInput(`civil_part_${i}`)}</td>
          <td className="border p-2">{tableInput(`civil_qty_${i}`)}</td>
          <td className="border p-2">{tableInput(`civil_rate_${i}`)}</td>
          <td className="border p-2">{tableInput(`civil_cost_${i}`)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            B(e) Organizational Setup & Manpower
          </h3>

          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Sr No</th>
                <th className="border p-2">Category</th>
                <th className="border p-2">No of Persons</th>
                <th className="border p-2">Salary / Month</th>
                <th className="border p-2">Total Salary</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className="border p-2 text-center">{i + 1}</td>
                  <td className="border p-2">{tableInput(`org_cat_${i}`)}</td>
                  <td className="border p-2">{tableInput(`org_no_${i}`)}</td>
                  <td className="border p-2">{tableInput(`org_salary_${i}`)}</td>
                  <td className="border p-2">{tableInput(`org_total_${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= B(f) Project Cost ================= */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            B(f) Project Cost
          </h3>

          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Particular of Cost</th>
                <th className="border p-2">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Land and Site Development",
                "Building",
                "Plant & Machinery",
                "Misc Fixed Assets",
                "Preliminary Expenses",
                "Pre-Operative Expenses",
                "Contingencies",
                "Margin Money",
                "Total",
              ].map((item, i) => (
                <tr key={i}>
                  <td className="border p-2">{item}</td>
                  <td className="border p-2">{tableInput(`pc_${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= B(g) Means of Finance ================= */}

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-800 mb-4">
            B(g) Means of Finance
          </h3>

          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Particular Agency</th>
                <th className="border p-2">Amount</th>
                <th className="border p-2">%</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Implementing Agency",
                "Govt of Maharashtra",
                "Bank Borrowings",
                "Others",
                "Total",
              ].map((item, i) => (
                <tr key={i}>
                  <td className="border p-2">{item}</td>
                  <td className="border p-2">{tableInput(`mf_amt_${i}`)}</td>
                  <td className="border p-2">{tableInput(`mf_pct_${i}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {/* ================= B(h) Working Capital ================= */}

<div className="bg-white rounded-xl shadow p-6 mb-8">
  <h3 className="text-lg font-bold text-blue-800 mb-4">
    B(h) Working Capital Requirement
  </h3>

  <table className="min-w-full border text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="border p-2">Particulars</th>
        <th className="border p-2">1 Month Requirement</th>
        <th className="border p-2">Margin</th>
        <th className="border p-2">Year 1</th>
        <th className="border p-2">Year 2</th>
        <th className="border p-2">Year 3</th>
      </tr>
    </thead>
    <tbody>
      {[
        "Raw Materials and Consumables",
        "Utilities",
        "Working Expenses (Salary of Manpower)",
        "Work in Process",
        "Stock of Finished Goods",
        "Bill Receivables",
        "Total",
      ].map((item, i) => (
        <tr key={i}>
          <td className="border p-2">{item}</td>
          <td className="border p-2">{tableInput(`wc_month_${i}`)}</td>
          <td className="border p-2">{tableInput(`wc_margin_${i}`)}</td>
          <td className="border p-2">{tableInput(`wc_y1_${i}`)}</td>
          <td className="border p-2">{tableInput(`wc_y2_${i}`)}</td>
          <td className="border p-2">{tableInput(`wc_y3_${i}`)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
     <div className="flex flex-wrap justify-center gap-6 mt-12 mb-12">

          <button
            onClick={() => handleGenerate("pdf")}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl shadow-md"
          >
            {loading ? "Generating..." : "Generate PDF"}
          </button>

          <button
            onClick={() => handleGenerate("word")}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-md"
          >
            Export Word
          </button>

          <button
            onClick={() => handleGenerate("excel")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-md"
          >
            Export Excel
          </button>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Annexure2;