import * as excel from 'excel4node';

class ExcelServices {
  private wb: any;

  constructor() {
    this.wb = new excel.Workbook({
      defaultFont: { size: 10, name: 'Liberation Sans' },
    });
  }

  async generateSampleEmployeeBulkUploadExcelSheet(obj: any) {
    // Create main worksheet
    let ws = this.wb.addWorksheet('Sheet1', {
      sheetFormat: {
        defaultColWidth: 20,
      },
    });

    // Create heading style
    let headingStyle = this.wb.createStyle({
      alignment: {
        shrinkToFit: true,
        wrapText: true,
        vertical: 'center',
        horizontal: 'center',
      },
    });

    // Create hidden worksheet for dropdown data
    let ws2 = this.wb.addWorksheet('Sheet2', { hidden: true });

    // Set up columns and their widths
    ws.row(1).setHeight(25);
    ws.column(9).setWidth(21);
    ws.column(10).setWidth(21);

    // Add headings to Sheet1
    ws.cell(1, 1).string('NAME').style(headingStyle);
    ws.cell(1, 2).string('EMAIL').style(headingStyle);
    ws.cell(1, 3).string('DATE_OF_JOINING (MM-DD-YYYY)').style(headingStyle);
    ws.cell(1, 4).string('DEPARTMENT').style(headingStyle);
    ws.cell(1, 5).string('DESIGNATION').style(headingStyle);
    ws.cell(1, 6).string('OFFICE').style(headingStyle);

    // Freeze first row
    ws.row(1).freeze();

    // Fill Sheet2 with dropdown data
    obj.groups.forEach((group: string, index: number) => {
      ws2.cell(index + 1, 1).string(group);
    });
    obj.departments.forEach((department: string, index: number) => {
      ws2.cell(index + 1, 2).string(department);
    });
    obj.designations.forEach((designation: string, index: number) => {
      ws2.cell(index + 1, 3).string(designation);
    });
    obj.locations.forEach((location: string, index: number) => {
      ws2.cell(index + 1, 4).string(location);
    });

    // Static "Yes"/"No" dropdowns
    ws2.cell(1, 5).string('Yes');
    ws2.cell(2, 5).string('No');

    ws2.cell(1, 6).string('Yes');
    ws2.cell(2, 6).string('No');

    // Fill sample employee data in Sheet1
    ws.cell(2, 1).string(obj.name.first + ' ' + obj.name.middle + ' ' + obj.name.last);
    ws.cell(2, 2).string(obj.email);
    ws.cell(2, 3).string(obj.dateOfJoining).style({ numberFormat: 'MM-DD-YYYY' });
    ws.cell(2, 4).string(obj.departments[0]);
    ws.cell(2, 5).string(obj.designations[0]);
    ws.cell(2, 6).string(obj.locations[0]);

    // Add data validations (Dropdowns)
    ws.addDataValidation({
      type: 'list',
      allowBlank: 0,
      prompt: 'Choose Group from dropdown',
      error: 'Invalid choice',
      showDropDown: true,
      sqref: 'D2:D200',
      formulas: [`=Sheet2!$B$1:$B$${obj.departments.length}`],
    });
    ws.addDataValidation({
      type: 'list',
      allowBlank: 0,
      prompt: 'Choose Designation from dropdown',
      error: 'Invalid choice',
      showDropDown: true,
      sqref: 'E2:E200',
      formulas: [`=Sheet2!$C$1:$C$${obj.designations.length}`],
    });
    ws.addDataValidation({
      type: 'list',
      allowBlank: 0,
      prompt: 'Choose Office from dropdown',
      error: 'Invalid choice',
      showDropDown: true,
      sqref: 'F2:F200',
      formulas: [`=Sheet2!$D$1:$D$${obj.locations.length}`],
    });

    // Return the buffer for download
    return this.wb.writeToBuffer();
  }
  
}

export const excelServices = new ExcelServices();
