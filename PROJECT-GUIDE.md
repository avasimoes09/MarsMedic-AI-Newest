# MarsMedic AI: Plain-English Project Guide

This guide is for finding things by browsing folders and filenames; you do not need repository search. Start at [README.md](./README.md) for installing and running the app. This page explains the folders, important files, screens, and buttons.

## Find the right place

| If you want to… | Open… |
|---|---|
| Change a screen or what its buttons do | [src/pages/](./src/pages/) |
| Change a shared screen part, such as the top navigation or device panel | [src/components/](./src/components/) |
| Change sign-in, patient session, or shared app data | [src/lib/MissionContext.jsx](./src/lib/MissionContext.jsx) |
| Change how the browser talks to the local service | [src/lib/localApi.js](./src/lib/localApi.js) |
| Change the local API or encrypted patient database | [server/](./server/) |
| Change how the Windows desktop app starts | [desktop/main.cjs](./desktop/main.cjs) |
| Change development startup | [scripts/dev.js](./scripts/dev.js) |
| Change the app's local web server, proxy, or PWA build | [vite.config.js](./vite.config.js) |
| Change colors, fonts, and shared layout styles | [src/index.css](./src/index.css) |
| Change app dependencies or available commands | [package.json](./package.json) |

## Folders in plain English

| Folder | What is inside |
|---|---|
| [.vscode/](./.vscode/) | Optional VS Code task shortcuts for this project. |
| [data/](./data/) | The local SQLite database created by the app. Treat it as private patient data; it is local runtime data, not source code. |
| [desktop/](./desktop/) | Electron startup code for the Windows desktop application. |
| [dev-dist/](./dev-dist/) | Generated offline/PWA service-worker files. These are build output, not where application features are edited. |
| [public/](./public/) | Static files copied into the app, including the logo and bundled fonts. |
| [public/fonts/](./public/fonts/) | Ubuntu font files and their license text. |
| [release/](./release/) | Generated desktop installers and packaged Windows app files. Edit source code instead of files in this folder. |
| [scripts/](./scripts/) | Helper scripts, including the command that starts the API and web development server together. |
| [server/](./server/) | Local HTTP API, encrypted SQLite storage, and API tests. |
| [src/](./src/) | The React application: screens, reusable interface parts, local state and data logic, and styles. |
| [src/api/](./src/api/) | Currently has no source files. |
| [src/components/](./src/components/) | Reusable parts used by multiple screens. |
| [src/components/ui/](./src/components/ui/) | Small reusable interface building blocks (buttons, menus, tabs, dialogs, and similar controls). These are building blocks, not individual app pages. |
| [src/components/wellness/](./src/components/wellness/) | Sleep, food, and wellbeing components used on the Energy screen. |
| [src/hooks/](./src/hooks/) | Reusable browser/device logic, including Bluetooth connections. |
| [src/lib/](./src/lib/) | Shared app state, API calls, medical reference data, and calculations. |
| [src/pages/](./src/pages/) | One main file per app screen. Start here when looking for a screen. |

## What the main buttons do

### Sign-in screen

| Button | What happens |
|---|---|
| **Emergency assessment** | Opens the emergency workflow at `/emergency`. No patient sign-in is needed. |
| Fingerprint/passkey button | Starts passkey sign-in on this device. |
| **Sign in with PIN** | Signs into the locally stored patient account and opens Home. |
| **Create account** | Changes the sign-in form to account creation. Creating an account then opens the patient profile page to finish setup. |
| **Create account and set up passkey** | Saves a local account, asks the device to register a passkey, then opens the profile page. |
| **Back to sign in** | Returns to the PIN/passkey sign-in form. |
| **Continue as guest** | Opens Home without a patient account. Patient-record features are unavailable in guest mode. |

The sign-in screen is in [MarsLogin.jsx](./src/pages/MarsLogin.jsx).

### Top navigation (after sign-in)

| Button | Opens |
|---|---|
| **Home** | `/dashboard` — readiness summary and shortcuts. |
| **Devices** | `/devices` — vital-sign and environmental Bluetooth sensors. |
| **Inventory** | `/inventory` — medical supplies and food/drink lists. |
| **Assess** | `/assessment` — select symptoms and run the decision-support assessment. |
| **Energy** | `/wellness` — sleep, food, and wellbeing tools. |
| **Patient Records** | `/commander` — saved patient profiles. Only shown for a signed-in patient, not a guest. |
| Patient name/profile button | `/crew` — edit the signed-in patient's profile, PIN, and passkeys. Not shown for guests. |
| **Exit** | Ends the current session and returns to sign-in. |

The top navigation and its route names are in [MissionShell.jsx](./src/components/MissionShell.jsx). The back-arrow button at the top of a page always goes to Home (`/dashboard`), not to the previous browser page; it is in [PageHeader.jsx](./src/components/PageHeader.jsx).

### Screen shortcuts and controls

| Screen / button | What happens |
|---|---|
| Home — **Set up passkey** | Opens `/crew` to register a device passkey. |
| Home — **Open patient record** / **View full record** | Opens `/twin`, the selected patient's health record. |
| Home — **Open inventory** | Opens `/inventory`. |
| Devices — **Vital signs** / **Environment** | Switches between two panels on the same screen. |
| Devices — **Connect BLE Device** | Asks the browser to connect to a compatible Bluetooth vital-sign device. |
| Devices — **Simulate Live Stream** / **Simulate live readings** | Shows sample readings for preview only. Simulated readings cannot be saved as real patient readings. |
| Devices — **Attach to Assessment** | Carries live vital readings into `/assessment`. |
| Devices — **Save to patient record** | Saves real vital-device readings to the encrypted local record, then opens `/twin`. |
| Devices — **Save readings to patient record** | Saves real environmental-sensor readings to the encrypted local record and stays on Devices. |
| Devices — **Disconnect** | Disconnects the currently connected sensor. |
| Devices — **°C / °F** | Changes how temperature is displayed. The stored sensor temperature remains Celsius. |
| Inventory — **Medical Supplies** / **Food & Drink** | Switches lists on the same screen. Inventory is saved in this browser on this device. |
| Inventory — **Add Item** / **Add Food or Drink** | Opens a form for a new inventory entry. |
| Inventory — **Edit** | Opens that item for editing. **Save** keeps the changes; **Cancel** discards them. |
| Inventory — trash/delete button | Opens a confirmation. **Delete** removes the item; **Cancel** keeps it. |
| Assess — body-system buttons | Opens or closes a symptom category. |
| Assess — symptom buttons | Selects or deselects symptoms. Selected symptoms appear as removable chips. |
| Assess — follow-up answer buttons | Selects or clears an answer to help narrow the assessment. |
| Assess — **Run AI Diagnosis** | Calculates and displays decision-support results. It is disabled until at least one symptom is selected. |
| Assessment results — **Start Treatment Coach** | Opens `/treatment` with the selected result's step-by-step plan. |
| Assessment results — **Generate Earth Alert** | Opens `/earth-alert` with a locally prepared report. |
| Assessment results — **New Assessment** | Clears the current selections and result so you can start again. |
| Emergency assessment — **Earth Alert** / **Contact Earth for Emergency** | Adds an emergency packet to the local queue. It does not send anything over the internet or radio. |
| Emergency protocol answers — **Continue**, **YES**, **NO**, and similar choices | Moves to the next step in the on-screen emergency protocol. |
| Patient profile — **Save changes** | Saves the health profile to the local patient account. |
| Patient profile — **Change PIN** | Changes the local account PIN after checking the current PIN and confirming the new one. |
| Patient profile — **Set up Windows Hello fingerprint** | Registers a passkey using Windows Hello on this device. |
| Patient profile — **Add external FIDO2 security key** | Starts passkey registration with an external security key. |
| Patient Records — **Clear assessment findings** | Clears the assessment findings shown for that patient. |
| Patient record — **Manage profiles** | Opens `/crew` to edit the signed-in patient's profile. |
| Treatment Coach — treatment step | Marks the next step complete. Earlier completed steps can be clicked to restart from there; later steps must be completed in order. |
| Treatment Coach — **Reassess Patient** | Clears the completed condition and opens `/assessment` again. |
| Space Medicine — a condition card | Shows that condition's description, symptoms, diagnosis, treatments, and prevention details on the same screen. **All Conditions** returns to the list. |
| Voice Assessment — microphone button | Demonstrates a sample phrase in the transcript, then opens `/assessment`. This is currently a demonstration; it does not capture actual speech. **Continue to Assessment** opens `/assessment` immediately. |
| Energy — sleep/food save and delete controls | Adds or removes the displayed sleep, meal, or wellbeing entries on this screen. |
| Unknown-page — **Go Home** | Returns to `/`, the sign-in/home entry screen. |

## Screen-to-file map

The route list is in [App.jsx](./src/App.jsx). Some screens are available through a shortcut or assessment flow rather than a top-navigation button.

| Screen | Route | Main file | What it is for |
|---|---|---|---|
| Sign-in and account creation | `/` | [MarsLogin.jsx](./src/pages/MarsLogin.jsx) | Local PIN/passkey sign-in, new account setup, guest entry, and emergency shortcut. |
| Emergency assessment | `/emergency` | [SymptomAssessment.jsx](./src/pages/SymptomAssessment.jsx) and [MedicalCopilot.jsx](./src/pages/MedicalCopilot.jsx) | Emergency protocol, vital readings, and locally queued alert details. |
| Patient profile | `/crew` | [CrewSelection.jsx](./src/pages/CrewSelection.jsx) | Edit patient details, change PIN, and manage passkeys. |
| Home | `/dashboard` | [Dashboard.jsx](./src/pages/Dashboard.jsx) | Medical readiness, readings, patient summary, and inventory shortcut. |
| Devices | `/devices` | [Devices.jsx](./src/pages/Devices.jsx) | Connect compatible vital or environmental Bluetooth sensors. |
| Inventory | `/inventory` | [Inventory.jsx](./src/pages/Inventory.jsx) | Maintain medical supply and food/drink quantities. |
| Assessment | `/assessment` | [SymptomAssessment.jsx](./src/pages/SymptomAssessment.jsx) | Select symptoms, answer follow-up questions, and see decision-support results. |
| Patient health record | `/twin` | [DigitalTwin.jsx](./src/pages/DigitalTwin.jsx) | View saved profile details, device readings, and assessment history. |
| Treatment Coach | `/treatment` | [TreatmentCoach.jsx](./src/pages/TreatmentCoach.jsx) | Follow the step-by-step plan created by an assessment. |
| Earth Alert | `/earth-alert` | [EarthAlert.jsx](./src/pages/EarthAlert.jsx) | Review and queue a patient report locally. It is not a transmission service. |
| Patient Records | `/commander` | [CommanderView.jsx](./src/pages/CommanderView.jsx) | View saved patient profiles and clear assessment findings. |
| Space Medicine | `/space-medicine` | [SpaceMedicine.jsx](./src/pages/SpaceMedicine.jsx) | Read reference cards about space-related conditions. |
| Voice Assessment | `/voice` | [VoiceAssessment.jsx](./src/pages/VoiceAssessment.jsx) | Demonstration workflow that leads to the assessment screen. |
| Sleep & Nutrition | `/wellness` | [Wellness.jsx](./src/pages/Wellness.jsx) | Track wellbeing entries and review local pattern insights. |
| Not found | Any unmatched route | [PageNotFound.jsx](./src/lib/PageNotFound.jsx) | Shows an error page and a button back to the app entry screen. |

`/copilot` redirects to `/emergency`. Old hosted-login paths such as `/login` and `/register` redirect to `/`; MarsMedic uses its local sign-in screen instead.

## Source-code file index

### App startup and shared components

| File | Plain-English label |
|---|---|
| [src/main.jsx](./src/main.jsx) | Starts React and loads the app-wide CSS. |
| [src/App.jsx](./src/App.jsx) | Connects the screens to their URL routes and wraps the app in shared providers. |
| [src/index.css](./src/index.css) | App-wide fonts, colors, layout styles, and reusable style classes. |
| [src/components/MissionShell.jsx](./src/components/MissionShell.jsx) | Signed-in layout, access checks, top navigation, patient switch, and Exit button. |
| [src/components/PageHeader.jsx](./src/components/PageHeader.jsx) | Shared page title and button that returns to Home. |
| [src/components/MissionClock.jsx](./src/components/MissionClock.jsx) | Displays the mission clock in the app header. |
| [src/components/ScrollToTop.jsx](./src/components/ScrollToTop.jsx) | Scrolls to the top when the route changes. |
| [src/components/PatientHealthFields.jsx](./src/components/PatientHealthFields.jsx) | Shared health-profile input fields. |
| [src/components/VitalsTelemetry.jsx](./src/components/VitalsTelemetry.jsx) | Vital-device connection, readings, simulation, and record-save controls. |
| [src/components/EnvironmentalTelemetry.jsx](./src/components/EnvironmentalTelemetry.jsx) | Environmental-device connection, readings, simulation, and record-save controls. |

### Screen files

| File | Plain-English label |
|---|---|
| [src/pages/MarsLogin.jsx](./src/pages/MarsLogin.jsx) | Local account sign-in, account creation, and guest entry. |
| [src/pages/CrewSelection.jsx](./src/pages/CrewSelection.jsx) | Patient profile and security settings. |
| [src/pages/Dashboard.jsx](./src/pages/Dashboard.jsx) | Home screen and shortcuts. |
| [src/pages/Devices.jsx](./src/pages/Devices.jsx) | Vital and environmental Bluetooth sensor tabs. |
| [src/pages/Inventory.jsx](./src/pages/Inventory.jsx) | Medical supplies and food/drink inventory. |
| [src/pages/SymptomAssessment.jsx](./src/pages/SymptomAssessment.jsx) | Normal and emergency assessment flows and their results. |
| [src/pages/MedicalCopilot.jsx](./src/pages/MedicalCopilot.jsx) | On-screen emergency protocol steps, embedded in emergency assessment. |
| [src/pages/DigitalTwin.jsx](./src/pages/DigitalTwin.jsx) | Patient health record, saved sensor readings, and assessment history. |
| [src/pages/TreatmentCoach.jsx](./src/pages/TreatmentCoach.jsx) | Guided treatment steps and progress. |
| [src/pages/EarthAlert.jsx](./src/pages/EarthAlert.jsx) | Emergency report review and local queue. |
| [src/pages/CommanderView.jsx](./src/pages/CommanderView.jsx) | List of saved patient records. |
| [src/pages/SpaceMedicine.jsx](./src/pages/SpaceMedicine.jsx) | Space-medicine reference information. |
| [src/pages/VoiceAssessment.jsx](./src/pages/VoiceAssessment.jsx) | Sample voice-workflow demonstration. |
| [src/pages/Wellness.jsx](./src/pages/Wellness.jsx) | Sleep, food, and wellbeing screen. |

### Shared state, data, and calculations

| File | Plain-English label |
|---|---|
| [src/lib/MissionContext.jsx](./src/lib/MissionContext.jsx) | Shared sign-in state, patient data, live readings, and app-session actions. |
| [src/lib/localApi.js](./src/lib/localApi.js) | Sends same-computer requests to the local API and reports API errors. |
| [src/lib/query-client.js](./src/lib/query-client.js) | Shared React Query client setup. |
| [src/lib/missionData.js](./src/lib/missionData.js) | Built-in symptom, body-system, supply, and space-medicine reference lists. |
| [src/lib/diagnosisEngine.js](./src/lib/diagnosisEngine.js) | Calculates assessment results from selected symptoms and health context. |
| [src/lib/diagnosisEngine.test.js](./src/lib/diagnosisEngine.test.js) | Tests for the assessment calculations. |
| [src/lib/followupQuestions.js](./src/lib/followupQuestions.js) | Chooses follow-up questions for selected symptoms. |
| [src/lib/vitalGuidance.js](./src/lib/vitalGuidance.js) | Interprets vital values into general reference guidance. |
| [src/lib/vitalGuidance.test.js](./src/lib/vitalGuidance.test.js) | Tests for vital reference guidance. |
| [src/lib/temperature.js](./src/lib/temperature.js) | Converts and formats Celsius/Fahrenheit values. |
| [src/lib/temperature.test.js](./src/lib/temperature.test.js) | Tests for temperature conversion and formatting. |
| [src/lib/wellnessData.js](./src/lib/wellnessData.js) | Built-in food choices, units, and date helpers for wellbeing screens. |
| [src/lib/wellnessPatterns.js](./src/lib/wellnessPatterns.js) | Finds patterns in the wellbeing entries. |
| [src/lib/utils.js](./src/lib/utils.js) | Small shared UI helper functions. |
| [src/lib/PageNotFound.jsx](./src/lib/PageNotFound.jsx) | Not-found page shown for an unknown route. |

### Bluetooth hooks and tests

| File | Plain-English label |
|---|---|
| [src/hooks/useVitalDevice.js](./src/hooks/useVitalDevice.js) | Connects to and reads supported vital-sign Bluetooth devices. |
| [src/hooks/useEnvironmentalDevice.js](./src/hooks/useEnvironmentalDevice.js) | Connects to and reads supported environmental Bluetooth sensors. |
| [src/hooks/useEnvironmentalDevice.test.js](./src/hooks/useEnvironmentalDevice.test.js) | Tests for environmental sensor behavior. |

### Wellbeing screen parts

| File | Plain-English label |
|---|---|
| [src/components/wellness/SleepPanel.jsx](./src/components/wellness/SleepPanel.jsx) | Sleep entry form and saved sleep entries. |
| [src/components/wellness/FoodPanel.jsx](./src/components/wellness/FoodPanel.jsx) | Food and drink entry form and saved entries. |
| [src/components/wellness/PatternInsights.jsx](./src/components/wellness/PatternInsights.jsx) | Wellbeing pattern summaries and saved insights. |
| [src/components/wellness/DigitalClockPicker.jsx](./src/components/wellness/DigitalClockPicker.jsx) | Reusable hour/minute picker for sleep times. |

### Reusable interface building blocks

These shared controls are imported by active screens and components.

| File | Plain-English label |
|---|---|
| [src/components/ui/alert-dialog.jsx](./src/components/ui/alert-dialog.jsx) | Confirmation dialogs for important actions. |
| [src/components/ui/button.jsx](./src/components/ui/button.jsx) | Shared button styles and variants. |
| [src/components/ui/tabs.jsx](./src/components/ui/tabs.jsx) | Switch between panels on the same screen. |
| [src/components/ui/toast.jsx](./src/components/ui/toast.jsx) | Toast message component. |
| [src/components/ui/toaster.jsx](./src/components/ui/toaster.jsx) | Displays toast notifications. |
| [src/components/ui/use-toast.jsx](./src/components/ui/use-toast.jsx) | Hook for showing toast messages. |

## Local service, desktop, and project setup files

| File | Plain-English label |
|---|---|
| [server/index.js](./server/index.js) | Starts the local HTTP API, serves the built app, and handles local account/device requests. |
| [server/secureStore.js](./server/secureStore.js) | Creates the local database, protects patient health data with the local encryption key, and stores PIN/passkey account data. |
| [server/api.test.js](./server/api.test.js) | Tests for the local API. |
| [scripts/dev.js](./scripts/dev.js) | Starts the local API and Vite development server together and stops both cleanly. |
| [desktop/main.cjs](./desktop/main.cjs) | Starts the Windows desktop window and its local-only service. |
| [public/marsmedic.svg](./public/marsmedic.svg) | App logo. |
| [public/fonts/ubuntu-regular.ttf](./public/fonts/ubuntu-regular.ttf) | Bundled regular Ubuntu font. |
| [public/fonts/ubuntu-bold.ttf](./public/fonts/ubuntu-bold.ttf) | Bundled bold Ubuntu font. |
| [public/fonts/UFL.txt](./public/fonts/UFL.txt) | Ubuntu font license. |
| [.vscode/tasks.json](./.vscode/tasks.json) | VS Code task shortcuts. |
| [index.html](./index.html) | Browser page shell that contains the React app. |
| [package.json](./package.json) | Project scripts and dependency list. |
| [package-lock.json](./package-lock.json) | Exact dependency versions installed by npm. Normally updated by npm, not edited by hand. |
| [vite.config.js](./vite.config.js) | Frontend build, local API proxy, offline/PWA settings, and explicit optional LAN HTTPS settings. |
| [tailwind.config.js](./tailwind.config.js) | Tailwind CSS theme and file scanning settings. |
| [postcss.config.js](./postcss.config.js) | CSS processing configuration. |
| [eslint.config.js](./eslint.config.js) | JavaScript/JSX lint rules. |
| [jsconfig.json](./jsconfig.json) | Editor and JavaScript type-checking settings, including the `@` source-folder shortcut. |
| [components.json](./components.json) | Configuration for the reusable UI component conventions. |
| [.gitignore](./.gitignore) | Files that should stay out of version control, including local data, build output, and environment settings. |
| [AGENTS.md](./AGENTS.md) | Project instructions for coding assistants and local/offline safeguards. |
| [CLAUDE.md](./CLAUDE.md) | Points coding assistants to the project instructions in `AGENTS.md`. |
| [README.md](./README.md) | Setup, offline use, desktop build, LAN safeguards, and backup guidance. |

The runtime `data/` database and generated `dev-dist/` and `release/` files may not exist in a fresh checkout. They are created locally or during builds and should not be used as the place to edit app behavior.
