// ============================================================
// Reusable Prescription Print Utility
// Pre-printed Letterhead Compatible (A4)
// ============================================================

export function printPrescription({ visit, prescription, doctor }) {
  const validMeds = (prescription?.medicines || []).filter(
    (m) => m.medicine_name && m.medicine_name.trim()
  );

  const today = visit?.visit_date
    ? new Date(visit.visit_date).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-PK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

  const medicinesRows = validMeds
    .map(
      (m, i) => `
      <tr>
        <td class="idx">${i + 1}</td>
        <td class="med-name">${m.medicine_name || ''}</td>
        <td class="dosage">${m.dosage || ''}</td>
        <td class="duration">${m.duration || ''}</td>
      </tr>`
    )
    .join('');

  const vitalsList = [
    prescription?.bp && `BP: ${prescription.bp}`,
    prescription?.pulse && `Pulse: ${prescription.pulse}`,
    prescription?.temperature && `Temp: ${prescription.temperature}°F`,
    prescription?.weight && `Weight: ${prescription.weight}kg`,
    prescription?.spo2 && `SpO₂: ${prescription.spo2}%`
  ]
    .filter(Boolean)
    .join('  |  ');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Rx - ${visit?.patient_name || 'Prescription'}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 210mm;
          height: 297mm;
          font-family: 'Arial', 'Helvetica', sans-serif;
          color: #1e293b;
          background: white;
        }

        .print-area {
          position: absolute;
          top: 72mm;
          left: 75mm;
          right: 12mm;
          bottom: 55mm;
        }

        .patient-line {
          font-size: 11px;
          margin-bottom: 8mm;
          line-height: 1.6;
        }
        .patient-line .field {
          display: inline-block;
          margin-right: 8mm;
        }
        .patient-line .label {
          color: #475569;
          font-weight: 600;
          font-size: 10px;
        }
        .patient-line .value {
          color: #0f172a;
          font-weight: 700;
          border-bottom: 1px dotted #94a3b8;
          padding: 0 4px 1px 4px;
          min-width: 40px;
          display: inline-block;
        }

        .section {
          margin-bottom: 5mm;
        }

        .section-label {
          font-size: 9px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1.5mm;
          padding-bottom: 1mm;
          border-bottom: 1px solid #cbd5e1;
        }

        .section-body {
          font-size: 11px;
          line-height: 1.6;
          color: #1e293b;
          white-space: pre-wrap;
        }

        .vitals-inline {
          font-size: 10px;
          color: #0f172a;
          font-weight: 600;
          padding: 2mm 0;
        }

        .rx-section {
          margin-top: 4mm;
        }

        .rx-symbol {
          font-family: 'Georgia', serif;
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2mm;
          line-height: 1;
        }

        .medicines-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .medicines-table thead th {
          text-align: left;
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 1.5mm 2mm;
          border-bottom: 1.5px solid #0f172a;
        }

        .medicines-table thead th:first-child { width: 6%; text-align: center; }
        .medicines-table thead th:nth-child(3) { width: 18%; text-align: center; }
        .medicines-table thead th:nth-child(4) { width: 18%; text-align: center; }

        .medicines-table tbody td {
          padding: 2.5mm 2mm;
          border-bottom: 1px dotted #cbd5e1;
          vertical-align: top;
          font-size: 11px;
        }

        .medicines-table tbody td.idx {
          text-align: center;
          font-weight: 700;
          color: #0f172a;
          font-family: 'Courier New', monospace;
        }

        .medicines-table tbody td.med-name {
          font-weight: 700;
          color: #0f172a;
        }

        .medicines-table tbody td.dosage,
        .medicines-table tbody td.duration {
          text-align: center;
          font-family: 'Courier New', monospace;
          color: #1e293b;
          font-weight: 600;
        }

        .followup {
          margin-top: 4mm;
          font-size: 11px;
        }
        .followup .label {
          font-weight: 700;
          color: #0f172a;
        }
        .followup .value {
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px dotted #94a3b8;
          padding: 0 4px 1px 4px;
        }

        @media print {
          body { width: 210mm; height: 297mm; }
          .print-area { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>

      <div class="print-area">

        <div class="patient-line">
          <span class="field">
            <span class="label">Name:</span>
            <span class="value">${visit?.patient_name || ''}</span>
          </span>
          <span class="field">
            <span class="label">Age:</span>
            <span class="value">${visit?.age || ''}</span>
          </span>
          <span class="field">
            <span class="label">Sex:</span>
            <span class="value">${visit?.gender || ''}</span>
          </span>
          <span class="field">
            <span class="label">MR#:</span>
            <span class="value">${visit?.mr_no || ''}</span>
          </span>
          <span class="field">
            <span class="label">Date:</span>
            <span class="value">${today}</span>
          </span>
        </div>

        ${
          vitalsList
            ? `<div class="section">
                <div class="section-label">Vitals</div>
                <div class="vitals-inline">${vitalsList}</div>
              </div>`
            : ''
        }

        ${
          prescription?.complaints
            ? `<div class="section">
                <div class="section-label">General Status / Complaints</div>
                <div class="section-body">${prescription.complaints}</div>
              </div>`
            : ''
        }

        ${
          prescription?.diagnosis
            ? `<div class="section">
                <div class="section-label">Diagnosis</div>
                <div class="section-body">${prescription.diagnosis}</div>
              </div>`
            : ''
        }

        ${
          validMeds.length > 0
            ? `<div class="rx-section">
                <div class="rx-symbol">℞</div>
                <table class="medicines-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>${medicinesRows}</tbody>
                </table>
              </div>`
            : ''
        }

        ${
          prescription?.advice
            ? `<div class="section" style="margin-top: 5mm;">
                <div class="section-label">Advice</div>
                <div class="section-body">${prescription.advice}</div>
              </div>`
            : ''
        }

        ${
          prescription?.follow_up_date
            ? `<div class="followup">
                <span class="label">Follow-up:</span>
                <span class="value">${new Date(prescription.follow_up_date).toLocaleDateString('en-PK', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}</span>
              </div>`
            : ''
        }

      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(html);
  printWindow.document.close();
}