# 営業日報システム API仕様書

## 1. 概要

### 1.1 基本情報
| 項目 | 内容 |
|------|------|
| ベースURL | `/api/v1` |
| 認証方式 | Bearer Token (JWT) |
| データ形式 | JSON |
| 文字コード | UTF-8 |

### 1.2 共通レスポンス形式

#### 成功時
```json
{
  "success": true,
  "data": { ... }
}
```

#### エラー時
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 1.3 共通HTTPステータスコード
| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース未存在 |
| 500 | サーバーエラー |

### 1.4 共通エラーコード
| コード | 説明 |
|--------|------|
| AUTH_REQUIRED | 認証が必要 |
| AUTH_INVALID | 認証情報が無効 |
| PERMISSION_DENIED | 権限なし |
| VALIDATION_ERROR | 入力値エラー |
| NOT_FOUND | リソースが存在しない |
| DUPLICATE_ERROR | 重複エラー |
| INTERNAL_ERROR | サーバー内部エラー |

---

## 2. API一覧

| No | メソッド | エンドポイント | 概要 | 認証 | 権限 |
|----|---------|---------------|------|------|------|
| 1 | POST | /auth/login | ログイン | 不要 | - |
| 2 | POST | /auth/logout | ログアウト | 必要 | 全員 |
| 3 | GET | /auth/me | ログインユーザー情報取得 | 必要 | 全員 |
| 4 | GET | /dashboard | ダッシュボード情報取得 | 必要 | 全員 |
| 5 | GET | /daily-reports | 日報一覧取得 | 必要 | 全員 |
| 6 | POST | /daily-reports | 日報作成 | 必要 | 営業 |
| 7 | GET | /daily-reports/:id | 日報詳細取得 | 必要 | 全員 |
| 8 | PUT | /daily-reports/:id | 日報更新 | 必要 | 営業（本人） |
| 9 | DELETE | /daily-reports/:id | 日報削除 | 必要 | 営業（本人） |
| 10 | GET | /daily-reports/:id/comments | コメント一覧取得 | 必要 | 全員 |
| 11 | POST | /daily-reports/:id/comments | コメント投稿 | 必要 | 管理者 |
| 12 | GET | /customers | 顧客一覧取得 | 必要 | 全員 |
| 13 | POST | /customers | 顧客作成 | 必要 | 全員 |
| 14 | GET | /customers/:id | 顧客詳細取得 | 必要 | 全員 |
| 15 | PUT | /customers/:id | 顧客更新 | 必要 | 全員 |
| 16 | DELETE | /customers/:id | 顧客削除 | 必要 | 管理者 |
| 17 | GET | /sales-persons | 営業一覧取得 | 必要 | 管理者 |
| 18 | POST | /sales-persons | 営業作成 | 必要 | 管理者 |
| 19 | GET | /sales-persons/:id | 営業詳細取得 | 必要 | 管理者 |
| 20 | PUT | /sales-persons/:id | 営業更新 | 必要 | 管理者 |
| 21 | DELETE | /sales-persons/:id | 営業削除 | 必要 | 管理者 |

---

## 3. 認証API

### 3.1 POST /auth/login
ログイン認証を行い、アクセストークンを取得する

#### リクエスト
```json
{
  "email": "tanaka@example.com",
  "password": "password123"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| email | string | ○ | メールアドレス |
| password | string | ○ | パスワード |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2025-01-13T10:00:00Z",
    "user": {
      "id": 1,
      "name": "田中太郎",
      "email": "tanaka@example.com",
      "department": "営業1課",
      "is_manager": false
    }
  }
}
```

#### レスポンス（エラー）
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### 3.2 POST /auth/logout
ログアウトする

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

### 3.3 GET /auth/me
ログイン中のユーザー情報を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "department": "営業1課",
    "is_manager": false
  }
}
```

---

## 4. ダッシュボードAPI

### 4.1 GET /dashboard
ダッシュボード表示用の情報を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "today": "2025-01-12",
    "today_report_status": {
      "has_report": true,
      "report_id": 123
    },
    "unread_comments_count": 3,
    "recent_reports": [
      {
        "id": 122,
        "report_date": "2025-01-11",
        "visit_count": 3,
        "comment_count": 1
      },
      {
        "id": 121,
        "report_date": "2025-01-10",
        "visit_count": 2,
        "comment_count": 0
      }
    ]
  }
}
```

---

## 5. 日報API

### 5.1 GET /daily-reports
日報一覧を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| date_from | string | - | 報告日（開始）YYYY-MM-DD |
| date_to | string | - | 報告日（終了）YYYY-MM-DD |
| sales_person_id | integer | - | 営業ID（管理者のみ指定可） |
| page | integer | - | ページ番号（デフォルト: 1） |
| per_page | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "report_date": "2025-01-12",
        "sales_person": {
          "id": 1,
          "name": "田中太郎"
        },
        "visit_count": 3,
        "comment_count": 1,
        "created_at": "2025-01-12T18:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_count": 100,
      "total_pages": 5
    }
  }
}
```

---

### 5.2 POST /daily-reports
日報を作成する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### リクエスト
```json
{
  "report_date": "2025-01-12",
  "problem": "競合他社との価格差について相談したい。",
  "plan": "・株式会社ABCへ見積書送付\n・新規顧客リストの作成",
  "visit_records": [
    {
      "customer_id": 1,
      "visit_time": "10:00",
      "visit_content": "新製品の提案を行った。先方は興味を示している。"
    },
    {
      "customer_id": 2,
      "visit_time": "14:00",
      "visit_content": "契約更新について打ち合わせ。来週までに回答予定。"
    }
  ]
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| report_date | string | ○ | 報告日（YYYY-MM-DD） |
| problem | string | - | 課題・相談 |
| plan | string | - | 明日やること |
| visit_records | array | - | 訪問記録の配列 |
| visit_records[].customer_id | integer | ○ | 顧客ID |
| visit_records[].visit_time | string | - | 訪問時刻（HH:MM） |
| visit_records[].visit_content | string | ○ | 訪問内容 |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 123,
    "report_date": "2025-01-12",
    "sales_person_id": 1,
    "problem": "競合他社との価格差について相談したい。",
    "plan": "・株式会社ABCへ見積書送付\n・新規顧客リストの作成",
    "visit_records": [
      {
        "id": 1,
        "customer_id": 1,
        "customer_name": "株式会社ABC",
        "visit_time": "10:00",
        "visit_content": "新製品の提案を行った。先方は興味を示している。"
      }
    ],
    "created_at": "2025-01-12T18:00:00Z",
    "updated_at": "2025-01-12T18:00:00Z"
  }
}
```

#### レスポンス（エラー：重複）
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ERROR",
    "message": "指定された日付の日報は既に存在します"
  }
}
```

---

### 5.3 GET /daily-reports/:id
日報詳細を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 日報ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 123,
    "report_date": "2025-01-12",
    "sales_person": {
      "id": 1,
      "name": "田中太郎",
      "department": "営業1課"
    },
    "problem": "競合他社との価格差について相談したい。",
    "plan": "・株式会社ABCへ見積書送付\n・新規顧客リストの作成",
    "visit_records": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "company_name": "株式会社ABC"
        },
        "visit_time": "10:00",
        "visit_content": "新製品の提案を行った。先方は興味を示している。"
      },
      {
        "id": 2,
        "customer": {
          "id": 2,
          "company_name": "株式会社XYZ"
        },
        "visit_time": "14:00",
        "visit_content": "契約更新について打ち合わせ。来週までに回答予定。"
      }
    ],
    "comments": [
      {
        "id": 1,
        "manager": {
          "id": 5,
          "name": "山田部長"
        },
        "coment": "価格については明日相談しましょう。",
        "created_at": "2025-01-12T15:30:00Z"
      }
    ],
    "is_owner": true,
    "created_at": "2025-01-12T18:00:00Z",
    "updated_at": "2025-01-12T18:00:00Z"
  }
}
```

---

### 5.4 PUT /daily-reports/:id
日報を更新する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 日報ID |

#### リクエスト
```json
{
  "report_date": "2025-01-12",
  "problem": "競合他社との価格差について相談したい。（更新）",
  "plan": "・株式会社ABCへ見積書送付\n・新規顧客リストの作成\n・競合調査",
  "visit_records": [
    {
      "id": 1,
      "customer_id": 1,
      "visit_time": "10:00",
      "visit_content": "新製品の提案を行った。先方は興味を示している。（追記あり）"
    },
    {
      "customer_id": 3,
      "visit_time": "16:00",
      "visit_content": "新規訪問"
    }
  ]
}
```

※ visit_records内のidがある場合は更新、ない場合は新規追加。送信されなかったidは削除。

#### レスポンス（成功）
POST /daily-reportsと同様の形式

---

### 5.5 DELETE /daily-reports/:id
日報を削除する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 日報ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "message": "日報を削除しました"
  }
}
```

---

### 5.6 GET /daily-reports/:id/comments
日報のコメント一覧を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 日報ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "manager": {
          "id": 5,
          "name": "山田部長"
        },
        "coment": "価格については明日相談しましょう。",
        "created_at": "2025-01-12T15:30:00Z"
      }
    ]
  }
}
```

---

### 5.7 POST /daily-reports/:id/comments
日報にコメントを投稿する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 日報ID |

#### リクエスト
```json
{
  "coment": "価格については明日相談しましょう。"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| coment | string | ○ | コメント内容 |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 2,
    "report_id": 123,
    "manager": {
      "id": 5,
      "name": "山田部長"
    },
    "coment": "価格については明日相談しましょう。",
    "created_at": "2025-01-12T16:00:00Z"
  }
}
```

---

## 6. 顧客API

### 6.1 GET /customers
顧客一覧を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| company_name | string | - | 会社名（部分一致） |
| page | integer | - | ページ番号（デフォルト: 1） |
| per_page | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "company_name": "株式会社ABC",
        "company_person": "佐藤一郎",
        "email": "sato@abc.co.jp",
        "phone": "03-1234-5678",
        "address": "東京都千代田区...",
        "created_at": "2025-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_count": 50,
      "total_pages": 3
    }
  }
}
```

---

### 6.2 POST /customers
顧客を作成する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### リクエスト
```json
{
  "company_name": "株式会社ABC",
  "company_person": "佐藤一郎",
  "email": "sato@abc.co.jp",
  "address": "東京都千代田区...",
  "phone": "03-1234-5678"
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| company_name | string | ○ | 会社名（最大200文字） |
| company_person | string | - | 担当者名（最大100文字） |
| email | string | - | メールアドレス |
| address | string | - | 住所（最大500文字） |
| phone | string | - | 電話番号（最大20文字） |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "株式会社ABC",
    "company_person": "佐藤一郎",
    "email": "sato@abc.co.jp",
    "address": "東京都千代田区...",
    "phone": "03-1234-5678",
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
}
```

---

### 6.3 GET /customers/:id
顧客詳細を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 顧客ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "株式会社ABC",
    "company_person": "佐藤一郎",
    "email": "sato@abc.co.jp",
    "address": "東京都千代田区...",
    "phone": "03-1234-5678",
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
}
```

---

### 6.4 PUT /customers/:id
顧客を更新する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 顧客ID |

#### リクエスト
POST /customersと同様

#### レスポンス（成功）
POST /customersと同様

---

### 6.5 DELETE /customers/:id
顧客を削除する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 顧客ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "message": "顧客を削除しました"
  }
}
```

#### レスポンス（エラー：参照あり）
```json
{
  "success": false,
  "error": {
    "code": "REFERENCE_ERROR",
    "message": "この顧客は訪問記録で使用されているため削除できません"
  }
}
```

---

## 7. 営業API

### 7.1 GET /sales-persons
営業一覧を取得する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | - | 氏名（部分一致） |
| department | string | - | 部署（部分一致） |
| page | integer | - | ページ番号（デフォルト: 1） |
| per_page | integer | - | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "田中太郎",
        "email": "tanaka@example.com",
        "department": "営業1課",
        "is_manager": false,
        "created_at": "2025-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_count": 10,
      "total_pages": 1
    }
  }
}
```

---

### 7.2 POST /sales-persons
営業を作成する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### リクエスト
```json
{
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "password": "password123",
  "department": "営業1課",
  "is_manager": false
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | ○ | 氏名（最大100文字） |
| email | string | ○ | メールアドレス（UNIQUE） |
| password | string | ○ | パスワード（8文字以上） |
| department | string | - | 部署（最大100文字） |
| is_manager | boolean | - | 管理者フラグ（デフォルト: false） |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "department": "営業1課",
    "is_manager": false,
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
}
```

#### レスポンス（エラー：重複）
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ERROR",
    "message": "このメールアドレスは既に登録されています"
  }
}
```

---

### 7.3 GET /sales-persons/:id
営業詳細を取得する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 営業ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "department": "営業1課",
    "is_manager": false,
    "created_at": "2025-01-12T10:00:00Z",
    "updated_at": "2025-01-12T10:00:00Z"
  }
}
```

---

### 7.4 PUT /sales-persons/:id
営業を更新する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 営業ID |

#### リクエスト
```json
{
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "password": "newpassword123",
  "department": "営業2課",
  "is_manager": true
}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | ○ | 氏名（最大100文字） |
| email | string | ○ | メールアドレス（UNIQUE） |
| password | string | - | パスワード（空欄時は変更なし） |
| department | string | - | 部署（最大100文字） |
| is_manager | boolean | - | 管理者フラグ |

#### レスポンス（成功）
POST /sales-personsと同様

---

### 7.5 DELETE /sales-persons/:id
営業を削除する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | integer | ○ | 営業ID |

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "message": "営業を削除しました"
  }
}
```

#### レスポンス（エラー：参照あり）
```json
{
  "success": false,
  "error": {
    "code": "REFERENCE_ERROR",
    "message": "この営業担当者は日報で使用されているため削除できません"
  }
}
```

#### レスポンス（エラー：自分自身）
```json
{
  "success": false,
  "error": {
    "code": "SELF_DELETE_ERROR",
    "message": "自分自身を削除することはできません"
  }
}
```

---

## 8. プルダウン用API

### 8.1 GET /masters/customers
顧客プルダウン用一覧を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "company_name": "株式会社ABC"
      },
      {
        "id": 2,
        "company_name": "株式会社XYZ"
      }
    ]
  }
}
```

---

### 8.2 GET /masters/sales-persons
営業プルダウン用一覧を取得する（管理者のみ）

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "田中太郎"
      },
      {
        "id": 2,
        "name": "山田花子"
      }
    ]
  }
}
```

---

### 8.3 GET /masters/departments
部署プルダウン用一覧を取得する

#### リクエストヘッダー
```
Authorization: Bearer {token}
```

#### レスポンス（成功）
```json
{
  "success": true,
  "data": {
    "items": [
      "営業1課",
      "営業2課",
      "営業3課"
    ]
  }
}
```
