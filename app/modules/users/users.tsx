import { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Sidebar } from '~/components/Sidebar';
import { HeaderBar } from '~/components/HeaderBar';
import { useSidebarToggle } from '~/hooks/useSidebarToggle';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '~/cores/api';
import type { User, CreateUserDto, UpdateUserDto } from '~/cores/api/types/user';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

export default function UsersModule() {
  const [isSidebarDark, setIsSidebarDark] = useState(true);
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebarToggle();

  const isDark = isSidebarDark;
  const bgClass = isDark ? 'bg-[#1a1d2e]' : 'bg-[#f5f7fa]';
  const cardClass = isDark ? 'bg-[#242838]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';

  const { data: users = [], isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [modalOpen, setModalOpen] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen('create');
  };

  const openEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      fullName: record.fullName,
      email: record.email,
      phoneNumber: record.phoneNumber ?? '',
      studentId: record.studentId ?? '',
      major: record.major ?? '',
      dateOfBirth: record.dateOfBirth ?? '',
      gender: record.gender ?? undefined,
      address: record.address ?? '',
      status: record.status ?? undefined,
    });
    setModalOpen('edit');
  };

  const closeModal = () => {
    setModalOpen(null);
    setEditingUser(null);
    form.resetFields();
  };

  const onFinishCreate = async (values: Record<string, unknown>) => {
    try {
      const body: CreateUserDto = {
        fullName: values.fullName as string,
        email: values.email as string,
        password: values.password as string,
        phoneNumber: (values.phoneNumber as string) || undefined,
        studentId: (values.studentId as string) || undefined,
        major: (values.major as string) || undefined,
        dateOfBirth: (values.dateOfBirth as string) || undefined,
        gender: (values.gender as string) || undefined,
        address: (values.address as string) || undefined,
      };
      await createUser(body).unwrap();
      message.success('User created successfully');
      closeModal();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; status?: number };
      message.error(err?.data?.message ?? 'Failed to create user');
    }
  };

  const onFinishEdit = async (values: Record<string, unknown>) => {
    if (!editingUser) return;
    try {
      const body: UpdateUserDto = {
        fullName: values.fullName as string,
        phoneNumber: (values.phoneNumber as string) || undefined,
        studentId: (values.studentId as string) || undefined,
        major: (values.major as string) || undefined,
        dateOfBirth: (values.dateOfBirth as string) || undefined,
        gender: (values.gender as string) || undefined,
        address: (values.address as string) || undefined,
        status: (values.status as string) || undefined,
      };
      await updateUser({ id: editingUser.userId, data: body }).unwrap();
      message.success('User updated successfully');
      closeModal();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } };
      message.error(err?.data?.message ?? 'Failed to update user');
    }
  };

  const onDelete = (record: User) => {
    Modal.confirm({
      title: 'Delete user?',
      content: `Delete "${record.fullName}" (${record.email})? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          await deleteUser(record.userId).unwrap();
          message.success('User deleted');
        } catch (e: unknown) {
          const err = e as { data?: { message?: string } };
          message.error(err?.data?.message ?? 'Failed to delete user');
        }
      },
    });
  };

  const columns: ColumnsType<User> = [
    { title: 'Full name', dataIndex: 'fullName', key: 'fullName', ellipsis: true },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber', ellipsis: true },
    { title: 'Student ID', dataIndex: 'studentId', key: 'studentId', ellipsis: true },
    { title: 'Major', dataIndex: 'major', key: 'major', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | null) =>
        status ? (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              status === 'active'
                ? 'bg-green-100 text-green-800'
                : status === 'inactive'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            {status}
          </span>
        ) : (
          '—'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Button type="link" size="small" danger onClick={() => onDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Sidebar
        isDark={isSidebarDark}
        currentPath="/users"
        onToggleSidebarTheme={() => setIsSidebarDark(!isSidebarDark)}
        isOpen={isSidebarOpen}
      />

      <HeaderBar
        isDark={isDark}
        title="Users"
        breadcrumb="Manage Users / All Users"
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <main
        className={`pt-24 p-6 ${bgClass} transition-all duration-300 min-h-screen ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className={`${cardClass} rounded-xl shadow-md p-6`}>
          <div className={`flex justify-between items-center mb-4 ${textClass}`}>
            <h2 className="text-lg font-bold">All Users</h2>
            <Button type="primary" onClick={openCreate}>
              Add User
            </Button>
          </div>
          <Table
            rowKey="userId"
            columns={columns}
            dataSource={users}
            loading={isLoading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 800 }}
          />
        </div>
      </main>

      <Modal
        title={modalOpen === 'create' ? 'Create User' : 'Edit User'}
        open={modalOpen !== null}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={modalOpen === 'create' ? onFinishCreate : onFinishEdit}
        >
          <Form.Item
            name="fullName"
            label="Full name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="Full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
          >
            <Input placeholder="email@example.com" disabled={modalOpen === 'edit'} />
          </Form.Item>

          {modalOpen === 'create' && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
          )}

          <Form.Item name="phoneNumber" label="Phone">
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item name="studentId" label="Student ID">
            <Input placeholder="Student ID" />
          </Form.Item>
          <Form.Item name="major" label="Major">
            <Input placeholder="Major" />
          </Form.Item>
          <Form.Item name="dateOfBirth" label="Date of birth">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" allowClear options={GENDER_OPTIONS} />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Address" />
          </Form.Item>

          {modalOpen === 'edit' && (
            <Form.Item name="status" label="Status">
              <Select placeholder="Status" allowClear options={STATUS_OPTIONS} />
            </Form.Item>
          )}

          <Form.Item className="mb-0 mt-4">
            <Space>
              <Button onClick={closeModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={modalOpen === 'create' ? isCreating : isUpdating}
              >
                {modalOpen === 'create' ? 'Create' : 'Update'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
