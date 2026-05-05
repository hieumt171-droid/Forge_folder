# Forge Hello World

This project contains a Forge app written in Javascript that displays `Hello World!` in a Jira issue panel. 

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start

- Modify your app frontend by editing the `src/frontend/index.jsx` file.

- Modify your app backend by editing the `src/resolvers/index.js` file to define resolver functions. See [Forge resolvers](https://developer.atlassian.com/platform/forge/runtime-reference/custom-ui-resolver/) for documentation on resolver functions.

- Build and deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

- Develop your app by running `forge tunnel` to proxy invocations locally:
```
forge tunnel
```

## Cài đặt app vào Jira

1. Mở terminal và chuyển vào thư mục app:
   ```
   cd c:\Users\NhoXanh\Desktop\Forge_folder\hieumt-first-app-v1
   ```
2. Triển khai app lên Forge:
   ```
   forge deploy
   ```
3. Cài app vào trang Jira của bạn:
   ```
   forge install
   ```
   - Nếu đang cài lần đầu, chọn site và project phù hợp theo hướng dẫn trong terminal.
4. Nếu muốn chạy local để debug nhanh, dùng:
   ```
   forge tunnel
   ```
   - Mở issue trong Jira và refresh trang để xem panel cập nhật.

## Kiểm tra trạng thái

- Loading state: `src/frontend/index.jsx` hiển thị `Spinner` khi đang fetch dữ liệu.
- Error state: `src/frontend/index.jsx` hiển thị `SectionMessage` nếu API gọi thất bại.
- Structured logging: `src/index.js` đã ghi `console.log(JSON.stringify(...))` với `level: 'info'` và `level: 'error'`.

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
