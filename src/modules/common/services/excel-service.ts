import ExcelJS from 'exceljs';

class ExcelServices {
  private wb: any;

  //   constructor() {
  //     this.wb = new excel.Workbook({
  //       defaultFont: { size: 10, name: 'Liberation Sans' },
  //     });
  //   }

  async generateSampleEmployeeBulkUploadExcelSheet(_offices?: any, _swb: any = this.wb) {
    const workbook = new ExcelJS.Workbook();

    // Create main sheet
    const ws = workbook.addWorksheet('Employee Upload');

    // Create hidden sheet for dropdown data
    const hiddenSheet = workbook.addWorksheet('DropdownData');

    // Dummy data for offices with their specific departments and designations
    let officesData = [
      {
        id: '1',
        name: 'Head Office',
        departments: [
          { id: 'HR1', name: 'Human Resources' },
          { id: 'FIN1', name: 'Finance' },
          { id: 'ENG1', name: 'Engineering' },
        ],
        designations: [
          { id: 'MGR1', name: 'Manager' },
          { id: 'SMGR1', name: 'Senior Manager' },
          { id: 'ENG2', name: 'Engineer' },
        ],
      },
      {
        id: '2',
        name: 'Branch Office 1',
        departments: [
          { id: 'MKT1', name: 'Marketing' },
          { id: 'SLS1', name: 'Sales' },
        ],
        designations: [
          { id: 'SE1', name: 'Sales Executive' },
          { id: 'MSP1', name: 'Marketing Specialist' },
        ],
      },
      {
        id: '3',
        name: 'Branch Office 2',
        departments: [
          { id: 'CS1', name: 'Customer Support' },
          { id: 'IT1', name: 'IT' },
        ],
        designations: [
          { id: 'SA1', name: 'Support Agent' },
          { id: 'ITS1', name: 'IT Specialist' },
        ],
      },
    ];

    // Add header row to the main sheet
    ws.addRow(['OFFICE ID', 'OFFICE', 'DEPARTMENT ID', 'DEPARTMENT', 'DESIGNATION ID', 'DESIGNATION', 'LOCATION']);

    // Populate the hidden sheet with dropdown data
    officesData.forEach((office, officeIndex) => {
      hiddenSheet.getCell(`A${officeIndex + 1}`).value = office.id; // Office IDs
      hiddenSheet.getCell(`B${officeIndex + 1}`).value = office.name; // Office names

      office.departments.forEach((dept, deptIndex) => {
        hiddenSheet.getCell(`C${officeIndex * 10 + deptIndex + 1}`).value = dept.id; // Department IDs
        hiddenSheet.getCell(`D${officeIndex * 10 + deptIndex + 1}`).value = dept.name; // Department names
      });

      office.designations.forEach((designation, designationIndex) => {
        hiddenSheet.getCell(`E${officeIndex * 10 + designationIndex + 1}`).value = designation.id; // Designation IDs
        hiddenSheet.getCell(`F${officeIndex * 10 + designationIndex + 1}`).value = designation.name; // Designation names
      });
    });

    // Set width of the columns
    ws.columns = [
      { header: 'Office ID', key: 'officeId', width: 20 },
      { header: 'Office', key: 'office', width: 20 },
      { header: 'Department ID', key: 'departmentId', width: 20 },
      { header: 'Department', key: 'department', width: 30 },
      { header: 'Designation ID', key: 'designationId', width: 20 },
      { header: 'Designation', key: 'designation', width: 30 },
      { header: 'Location', key: 'location', width: 20 },
    ];

    // Add 200 rows for user input
    for (let i = 2; i <= 200; i++) {
      ws.getRow(i).commit();
    }

    // Add data validation for Office column
    for (let i = 2; i <= 200; i++) {
      ws.getCell(`B${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`DropdownData!$B$1:$B$${officesData.length}`],
      };

      // Add data validation for Department based on selected office
      ws.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [
          `OFFSET(DropdownData!$D$1, (MATCH(B${i}, DropdownData!$B$1:$B$${officesData.length}, 0)-1)*10, 0, COUNTIF(DropdownData!$B$1:$B$${officesData.length}, B${i}), 1)`,
        ],
      };

      // Add data validation for Designation based on selected office
      ws.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [
          `OFFSET(DropdownData!$F$1, (MATCH(B${i}, DropdownData!$B$1:$B$${officesData.length}, 0)-1)*10, 0, COUNTIF(DropdownData!$B$1:$B$${officesData.length}, B${i}), 1)`,
        ],
      };
    }

    // Write to buffer and return
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

export const excelServices = new ExcelServices();
