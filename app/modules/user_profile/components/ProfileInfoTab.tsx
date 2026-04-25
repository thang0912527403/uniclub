import React from "react";
import type { UpdateUserDto } from "~/cores/api/types/user";
import Field from "./Field";

interface ProfileInfoTabProps {
  user: any;
  form: UpdateUserDto;
  setForm: React.Dispatch<React.SetStateAction<UpdateUserDto>>;
  isEditing: boolean;
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  user,
  form,
  setForm,
  isEditing,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <i className="fas fa-user text-orange-500" /> Thông tin cơ bản
        </h3>
        <div className="space-y-4">
          <Field
            label="Họ và tên"
            icon="fa-id-card"
            value={form.fullName}
            field="fullName"
            editable={isEditing}
            onChange={(val) => setForm((f) => ({ ...f, fullName: val }))}
            required
          />
          <Field
            label="Số điện thoại"
            icon="fa-phone"
            value={form.phoneNumber ?? ""}
            field="phoneNumber"
            editable={isEditing}
            onChange={(val) => setForm((f) => ({ ...f, phoneNumber: val }))}
          />
          <Field
            label="Ngày sinh"
            icon="fa-calendar"
            value={form.dateOfBirth ?? ""}
            field="dateOfBirth"
            type="date"
            editable={isEditing}
            onChange={(val) => setForm((f) => ({ ...f, dateOfBirth: val }))}
          />
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <i className="fas fa-venus-mars text-orange-400 w-4 text-center" />{" "}
              Giới tính
            </label>
            {isEditing ? (
              <select
                value={form.gender ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gender: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              >
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            ) : (
              <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
                {form.gender === "Male"
                  ? "Nam"
                  : form.gender === "Female"
                    ? "Nữ"
                    : form.gender || "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <i className="fas fa-graduation-cap text-orange-500" /> Thông tin học
          vụ
        </h3>
        <div className="space-y-4">
          <Field
            label="Mã số sinh viên"
            icon="fa-hashtag"
            value={form.studentId ?? ""}
            field="studentId"
            editable={isEditing}
            onChange={(val) => setForm((f) => ({ ...f, studentId: val }))}
          />
          <Field
            label="Chuyên ngành"
            icon="fa-book"
            value={form.major ?? ""}
            field="major"
            editable={isEditing}
            onChange={(val) => setForm((f) => ({ ...f, major: val }))}
          />
          <Field
            label="Địa chỉ"
            icon="fa-map-marker-alt"
            value={form.address ?? ""}
            field="address"
            editable={isEditing}
            onChange={(val) => setForm((f) => ({ ...f, address: val }))}
          />

          {/* Read-only fields */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <i className="fas fa-envelope text-orange-400 w-4 text-center" />{" "}
              Email
            </label>
            <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
              {user?.email || "—"}
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <i className="fas fa-clock text-orange-400 w-4 text-center" />{" "}
              Ngày tham gia
            </label>
            <p className="text-sm text-gray-800 dark:text-gray-200 py-2">
              {user?.joinDate
                ? new Date(user.joinDate).toLocaleDateString("vi-VN")
                : user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoTab;
