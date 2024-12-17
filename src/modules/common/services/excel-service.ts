import ExcelJS from 'exceljs';

class ExcelServices {
  async generateSampleEmployeeBulkUploadExcelSheet(offices: string[], departments: string[], jobTitles: string[]) {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Employee Upload');
    const hiddenSheet = workbook.addWorksheet('DropdownData');
    hiddenSheet.state = 'hidden';

    // Dummy data
    const dummyData = {
      name: 'John Doe',
      phoneNumber: '1234567890',
      email: 'john.doe@example.com',
      offices: offices,
      departments: departments,
      jobTitles: jobTitles,
    };

    // Populate hidden sheet with dropdown values
    offices.forEach((office, index) => (hiddenSheet.getCell(`A${index + 1}`).value = office));
    departments.forEach((dept, index) => (hiddenSheet.getCell(`B${index + 1}`).value = dept));
    jobTitles.forEach((jobTitle, index) => (hiddenSheet.getCell(`C${index + 1}`).value = jobTitle));

    // Define columns for the main sheet
    ws.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Joining Date', key: 'joiningDate', width: 20 },
      { header: 'Office', key: 'office', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Job Title', key: 'jobTitle', width: 20 },
      { header: 'Phone Number', key: 'phoneNumber', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
    ];

    // Populate the first row with dummy data (randomly for Office, Department, and Job Title)
    ws.addRow({
      employeeName: dummyData.name,
      joiningDate: new Date(), // You can set a static date or dynamic here
      office: this.getRandomItem(offices),
      department: this.getRandomItem(departments),
      jobTitle: this.getRandomItem(jobTitles),
      phoneNumber: dummyData.phoneNumber,
      email: dummyData.email,
    });

    // Add data validation for Office, Department, and Job Title
    for (let i = 2; i <= 100; i++) {
      ws.getCell(`C${i}`).dataValidation = {
        type: 'list',
        formulae: [`DropdownData!$A$1:$A$${offices.length}`],
      };
      ws.getCell(`D${i}`).dataValidation = {
        type: 'list',
        formulae: [`DropdownData!$B$1:$B$${departments.length}`],
      };
      ws.getCell(`E${i}`).dataValidation = {
        type: 'list',
        formulae: [`DropdownData!$C$1:$C$${jobTitles.length}`],
      };
    }

    // Write to buffer and return the file
    return await workbook.xlsx.writeBuffer();
  }

  private getRandomItem(arr: string[]): string {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex] ?? "Unknown"; // Returns a random item from the array
  }
}

export const excelServices = new ExcelServices();
