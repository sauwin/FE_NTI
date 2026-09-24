# NTI Frontend

Vue 3 frontend for the NTI platform — a web application for managing student and company applications, programme calls, evaluations and mentorships.

The frontend works together with the **BE_NTI** Laravel backend.

## Tech Stack

* Vue 3 + Composition API
* TypeScript
* Vite
* Tailwind CSS v4
* Pinia
* Vue Router
* Axios
* vue-i18n
* Tiptap
* docx / jsPDF / xlsx
* Playwright

## Requirements

* Node.js `^20.19.0` or `>=22.12.0`
* [BE_NTI](https://github.com/sauwin/) running on `http://localhost:8000`

## Setup

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

The app runs on:

```text
http://localhost:5173
```

The API is expected at:

```text
http://localhost:8000/api
```

The API URL is currently configured in `src/shared/api/axios.ts`.

### Production build

```sh
npm run build
```

The production files are generated in `dist/`.

To preview the build:

```sh
npm run preview
```

## Docker

Docker configuration is included for local development.

```sh
docker compose up
```

The frontend will be available on port `5173`.

## Project Structure

```text
src/
├── app/
│   ├── layouts/
│   ├── pages/
│   ├── plugins/
│   ├── router/
│   └── styles/
│
├── features/
│   ├── about/
│   ├── admin/
│   ├── applications/
│   ├── articles/
│   ├── auth/
│   ├── company/
│   ├── evaluation/
│   ├── faq/
│   ├── mentor/
│   ├── milestones/
│   ├── partners/
│   ├── program_a/
│   ├── program_b/
│   ├── student/
│   └── tasks/
│
└── shared/
    ├── api/
    ├── components/
    └── types/
```

Feature-specific code is kept inside `features/<name>`:

```text
features/<name>/
├── api/
├── components/
├── locales/
├── pages/
├── stores/
└── types/
```

## Roles

The platform has different dashboards and permissions depending on the user's role.

| Role           | Slug             | Main access                       |
| -------------- | ---------------- | --------------------------------- |
| Student        | `student`        | Applications, profile, milestones |
| Company        | `company`        | Company tasks and dashboard       |
| Mentor         | `mentor`         | Mentorships                       |
| Evaluator      | `evaluator`      | Application evaluations           |
| Content Editor | `content_editor` | Articles                          |
| NTI Admin      | `nti_admin`      | Administration                    |
| Super Admin    | `super_admin`    | Administration                    |

Route guards handle authentication and role-based access.

Unauthenticated users are redirected to `/auth/login`. Users without the required permissions are redirected to `/unauthorized`.

Students who have not completed their profile are redirected to `/profile/complete`.

## Routes

### Public

| Path          | Page           |
| ------------- | -------------- |
| `/`           | Home           |
| `/programs/a` | Programme A    |
| `/programs/b` | Programme B    |
| `/about`      | About          |
| `/faq`        | FAQ            |
| `/partners`   | Partners       |
| `/privacy`    | Privacy Policy |
| `/terms`      | Terms of Use   |

### Authentication

| Path                    | Page                |
| ----------------------- | ------------------- |
| `/auth/login`           | Login               |
| `/auth/register`        | Register            |
| `/auth/forgot-password` | Forgot password     |
| `/auth/reset-password`  | Reset password      |
| `/pending-verification` | Email verification  |
| `/verified`             | Verification result |

### Authenticated

| Path                      | Access  | Page                    |
| ------------------------- | ------- | ----------------------- |
| `/dashboard`              | All     | Dashboard               |
| `/profile`                | Student | Profile                 |
| `/profile/complete`       | Student | Profile setup           |
| `/mentor-profile`         | Mentor  | Mentor profile          |
| `/programs/a/upload`      | Student | Programme A application |
| `/programs/b/apply/:id`   | Student | Programme B application |
| `/programs/b/create-task` | Company | Create task             |
| `/programs/b/tasks/:id`   | All     | Task details            |

## Internationalisation

The frontend supports English and Slovak.

The selected locale is stored in `localStorage` using the `locale` key.

Translations are kept inside each feature:

```text
features/<name>/locales/
├── en.json
└── sk.json
```
