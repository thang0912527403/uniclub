# Multiple Base URLs Configuration

## Cấu trúc

Mỗi API có thể có base URL riêng:

```typescript
// baseApi.ts
export const API_URLS = {
  MAIN_SERVICE: 'https://localhost:7237/api',      // RecruitmentCampaign
  USER_SERVICE: 'https://localhost:7238/api',      // User, Auth
  NOTIFICATION_SERVICE: 'https://localhost:7239/api', // Notifications
};
```

## Cách tạo API mới với base URL riêng

### Ví dụ: Tạo User API

```typescript
// userApi.ts
import { userApi } from './baseApi';

export const userApiEndpoints = userApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users', // Sẽ gọi đến: https://localhost:7238/api/users
      providesTags: ['User'],
    }),
    
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation } = userApiEndpoints;
```

## Cách sử dụng

```typescript
// Trong component
import { useGetRecruitmentCampaignsQuery } from '~/cores/api'; // Gọi đến MAIN_SERVICE
import { useGetUsersQuery } from '~/cores/api'; // Gọi đến USER_SERVICE

function MyComponent() {
  const { data: campaigns } = useGetRecruitmentCampaignsQuery(); // localhost:7237
  const { data: users } = useGetUsersQuery(); // localhost:7238
  
  return <div>...</div>;
}
```

## Thêm API service mới

1. **Thêm URL vào API_URLS:**
```typescript
export const API_URLS = {
  MAIN_SERVICE: 'https://localhost:7237/api',
  USER_SERVICE: 'https://localhost:7238/api',
  NEW_SERVICE: 'https://localhost:7240/api', // ← Thêm mới
};
```

2. **Tạo API instance mới:**
```typescript
export const newServiceApi = createApi({
  reducerPath: 'newServiceApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URLS.NEW_SERVICE,
    prepareHeaders 
  }),
  tagTypes: ['NewTag'],
  endpoints: () => ({}),
});
```

3. **Thêm vào store:**
```typescript
// store/index.ts
import { baseApi, userApi, newServiceApi } from '../api/baseApi';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [newServiceApi.reducerPath]: newServiceApi.reducer, // ← Thêm
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware)
      .concat(userApi.middleware)
      .concat(newServiceApi.middleware), // ← Thêm
});
```

4. **Export trong index.ts:**
```typescript
export { baseApi, userApi, newServiceApi } from './baseApi';
```

## Lợi ích

✅ Mỗi API có base URL riêng (microservices)  
✅ Dễ dàng thay đổi URL từng service  
✅ Cache riêng biệt cho mỗi service  
✅ Có thể scale độc lập
