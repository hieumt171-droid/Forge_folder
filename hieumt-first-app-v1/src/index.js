// src/index.js

import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

 

// Tạo instance Resolver

// Resolver quản lý tất cả các backend functions của app

const resolver = new Resolver();

 

// Định nghĩa function 'getIssueDetails'

// Tên này phải khớp với tên bạn dùng khi gọi invoke() ở frontend

resolver.define('getIssueDetails', async ({ payload, context }) => {

  // payload: data do frontend gửi lên (qua invoke('getIssueDetails', payload))

  // context: metadata về người dùng đang thực hiện request

  //   - context.accountId: Atlassian Account ID của user

  //   - context.cloudId: ID của Jira/Confluence site

  //   - context.environmentId: 'development' | 'staging' | 'production'

  const { issueKey } = payload;

  // Log có cấu trúc để dễ debug sau này với forge logs

  console.log(JSON.stringify({

    level: 'info',

    message: 'getIssueDetails called',

    issueKey,

    accountId: context.accountId

  }));
  

 

  // Gọi Jira REST API

  // api.asApp(): sử dụng quyền của App (dùng scopes trong manifest)

  // api.asUser(): sử dụng quyền của User đang login (cần thêm config)

  // route`...`: template literal đặc biệt, ngăn URL injection tự động encode params

  try {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/issue/${issueKey}?fields=summary,status,priority,assignee,created`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
  console.log(JSON.stringify({
    level: 'info',
    message: 'getIssueDetails Jira response',
    issueKey,
    status: response.status,
    ok: response.ok
  }));
 

  // Luôn kiểm tra response.ok trước khi parse JSON

  // Nếu không check, JSON.parse() sẽ throw khi nhận HTML error page

  if (!response.ok) {

    const errorText = await response.text();

    console.log(JSON.stringify({

      level: 'error',

      message: 'Jira API call failed',

      status: response.status,

      issueKey,

      errorText: errorText.substring(0, 200) // Giới hạn để không log quá dài

    }));

    throw new Error(`Không thể tải issue ${issueKey}. Status: ${response.status}`);

  }

  const issue = await response.json();
  console.log(JSON.stringify({
    level: 'info',
    message: 'getIssueDetails success',
    issueKey,
    status: issue.fields?.status?.name,
    assignee: issue.fields?.assignee?.displayName ?? 'Chưa được giao',
    priority: issue.fields?.priority?.name ?? 'Không xác định'
  }));
 
  // Xử lý trường hợp assignee có thể là null
  const assigneeName = issue.fields.assignee?.displayName ?? 'Chưa được giao';
  const priorityName = issue.fields.priority?.name ?? 'Không xác định';
  // Chỉ trả về data cần thiết (không gửi nguyên cục issue JSON về frontend)
  
  return {
    key:      issueKey,
    summary:  issue.fields.summary,
    status:   issue.fields.status.name,
    priority: priorityName,
    assignee: assigneeName,
    created:  issue.fields.created, // ISO 8601 string
  };
  } catch (err) {
    console.log(JSON.stringify({
      level: 'error',
      message: 'getIssueDetails failed',
      issueKey,
      error: err.message,
      stack: err.stack?.substring(0, 1000)
    }));
    throw err;
  }
});

 

// Export handler – tên 'handler' phải khớp với 'handler' trong manifest.yml

// Ví dụ manifest: handler: src/index.handler

//   → File: src/index.js, Export: handler

export const handler = resolver.getDefinitions();