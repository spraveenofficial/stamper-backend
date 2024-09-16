import Employee from './employee.model';

export const addEmployee = async (employeeBody: any): Promise<any> => {
  // if (await Employee.isEmployeeExist(employeeBody.userId)) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, 'Employee already exist');
  // }
  return Employee.create(employeeBody);
};

export const getEmployeeById = async (id: string): Promise<any> => Employee.findById(id);

export const getEmployeeByUserId = async (userId: string): Promise<any> => Employee.findOne({ userId });
