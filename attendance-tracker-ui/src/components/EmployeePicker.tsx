import { useMemo, useState } from "react";
import type { Employee } from "../types/attendance";

interface EmployeePickerProps {
  employees: Employee[];
  value: string;
  onChange: (empNo: string) => void;
}

function EmployeePicker({
  employees,
  value,
  onChange,
}: EmployeePickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedEmployee = employees.find(
    (employee) => employee.empNo === value
  );

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return employees;
    }

    return employees.filter((employee) => {
      const empNo = employee.empNo?.toLowerCase() ?? "";
      const name = employee.name?.toLowerCase() ?? "";
      const department =
        employee.department?.toLowerCase() ?? "";

      return (
        empNo.includes(normalized) ||
        name.includes(normalized) ||
        department.includes(normalized)
      );
    });
  }, [employees, query]);

  function handleSelect(employee: Employee) {
    onChange(employee.empNo);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="employee-picker">
      <button
        type="button"
        className="employee-picker-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        {selectedEmployee ? (
          <div className="selected-employee">
            <strong>
              {selectedEmployee.empNo} - {selectedEmployee.name}
            </strong>

            <span>
              {selectedEmployee.department || "No department"}
            </span>
          </div>
        ) : (
          <span className="employee-picker-placeholder">
            Select employee
          </span>
        )}

        <span className="employee-picker-arrow">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="employee-picker-menu">
          <div className="employee-picker-search">
            <input
              type="text"
              placeholder="Search name, number or department..."
              value={query}
              autoFocus
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="employee-picker-list">
            {filteredEmployees.length === 0 ? (
              <div className="employee-picker-empty">
                No employees found.
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <button
                  type="button"
                  key={employee.empNo}
                  className={
                    employee.empNo === value
                      ? "employee-option active"
                      : "employee-option"
                  }
                  onClick={() => handleSelect(employee)}
                >
                  <div>
                    <strong>
                      {employee.empNo} - {employee.name}
                    </strong>

                    <span>
                      {employee.department || "No department"}
                    </span>
                  </div>

                  {employee.shift && (
                    <small>
                      Shift {employee.shift}
                    </small>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeePicker;