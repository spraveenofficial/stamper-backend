import * as excel from 'excel4node';

class ExcelServices {
  private wb: any;

  constructor() {
    this.wb = new excel.Workbook({
      defaultFont: { size: 10, name: 'Liberation Sans' },
    });
  }

  async generateSampleEmployeeBulkUploadExcelSheet(_obj?: any, _swb: any = this.wb) {
    // Create workbook and worksheets
    let wb = new excel.Workbook();
    let ws = wb.addWorksheet('Sheet1');
    let ws2 = wb.addWorksheet('Sheet2', { hidden: true });

    // Define headers
    ws.cell(1, 1).string('EMPLOYEE_ID');
    ws.cell(1, 2).string('EMPLOYEE_NAME');
    ws.cell(1, 3).string('DEPARTMENT');
    ws.cell(1, 4).string('OFFICE');

    // Dummy data for dropdown options
    const departments = ['Development', 'HR', 'Finance', 'Marketing'];
    const offices = ['New York', 'San Francisco', 'London', 'Tokyo'];

    // Insert dropdown options in the hidden Sheet2
    departments.forEach((dept, index) => {
      ws2.cell(index + 1, 1).string(dept); // Column A for Departments
    });
    offices.forEach((office, index) => {
      ws2.cell(index + 1, 2).string(office); // Column B for Offices
    });

    // Data validation for dropdowns
    ws.addDataValidation({
      type: 'list',
      allowBlank: 0,
      prompt: 'Choose a Department',
      error: 'Invalid Department selected',
      showDropDown: true,
      sqref: 'C2:C100', // Range for department dropdown
      formulas: [`Sheet2!$A$1:$A$${departments.length}`], // Reference for departments
    });

    ws.addDataValidation({
      type: 'list',
      allowBlank: 0,
      prompt: 'Choose an Office',
      error: 'Invalid Office selected',
      showDropDown: true,
      sqref: 'D2:D100', // Range for office dropdown
      formulas: [`Sheet2!$B$1:$B$${offices.length}`], // Reference for offices
    });

    // Write the workbook to a buffer
    const buffer = await wb.writeToBuffer();
    return buffer;
  }
}

export const excelServices = new ExcelServices();
