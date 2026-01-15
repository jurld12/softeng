## Software Engineering Group Project Report

Stage 1: The Bid

Group 12:  Healio

# Table of Contents {#table-of-contents}

[Table of Contents](#table-of-contents)

[Introduction](#introduction)

[Purpose](#purpose)

[Scope](#scope)

[Aims](#aims)

[Objectives](#objectives)

[Functional Requirements](#functional-requirements)

[User Functional Requirements](#user-functional-requirements)

[System Functional Requirements](#system-functional-requirements)

[Non-Functional Requirements](#non-functional-requirements)

[User Non-Functional Requirements](#user-non-functional-requirements)

[System Non-Functional Requirements](#system-non-functional-requirements)

[Use Case Diagrams](#use-case-diagrams)

[Risk Management Approach](#risk-management-approach)

[Risk documentation](#risk-documentation)

[Risk Identification](#risk-identification)

[Risk Monitoring](#risk-monitoring)

[Technological Choices, Software and Tools](#technological-choices,-software-and-tools)

[System Structure And Top Level Design](#system-structure-and-top-level-design)

[System Type And Platform Choice](#system-type-and-platform-choice)

[Development Methodology](#development-methodology)

[Project Management Utilities](#project-management-utilities)

[Team Roles](#team-roles)

[Project Timeline And Task Allocation](#project-timeline-and-task-allocation)

[Gantt Charts](#gantt-charts)

[Cost Analysis](#cost-analysis)

[Calculations](#calculations)

[Salary Costs](#salary-costs)

[Hardware Costs](#hardware-costs)

[Software Costs](#software-costs)

[Overall Costs](#overall-costs)

[Usability Test Plan](#usability-test-plan)

[Objective](#objective)

[Specific Aims](#specific-aims)

[Methodology](#methodology)

[Participants](#participants)

[Test Scenarios and Tasks](#test-scenarios-and-tasks)

[Metrics & Data Collection](#metrics-&-data-collection)

[Usability Test Protocol](#usability-test-protocol)

[Aim of this Test](#aim-of-this-test)

[Usability results](#usability-results)

[Test subject demographics](#test-subject-demographics)

[Questionnaire Results](#questionnaire-results)

[Summary of responses](#summary-of-responses)

[Layout and design](#layout-and-design)

[Features](#features)

[Appendix](#appendix-i) 

[Input Types](#input-types)

[Prototype](#prototype)

[Consent Form](#consent-form)

Table List  
Acronyms Table  
Data Definitions Table  
Table 1.1		User Functional Requirements  
Table 1.2		System Functional Requirements  
Table 1.3		User Non-Functional Requirements  
Table 1.4 		System Non-Functional Requirements  
Table 2.1 		Risk Documentation  
Table 2.2 		Risk Priority Key  
Table 2.3 		Risk Prioritisation  
Table 2.4 		Risk Planning  
Table 2.5 		Risk Monitoring  
Table 3.1 		Team Roles A  
Table 3.2 		Team Roles B  
Table 4.1 		Summary table of Salary costs  
Table 4.2 		Summary table of hardware costs  
Table 4.3 		Summary table of software costs  
Table 4.4 		Summary table of overall costs  
Table 5.1		Task Scenarios and related functional requirements  
Table 5.2 		Usability test results for Gender  
Table 5.3 		Usability test results for Age  
Table 5.4 		Usability test results for Field of study  
Table 5.5		Usability test results for Technical Ability  
Table 5.6 		Usability test results for Application and Device Usage  
Table 5.7		Usability test results for Most Frequently checked data  
Table 5.8		Usability test results for Preferences in type of website  
Table 5.9		Usability test results for if User was willing to manually enter data  
Table 5.10		Usability test results for Gamification  
Table 5.11		Usability test results for Gamification  
Table 5.12 		Usability test results for Accessibility feature usage  
Table 5.13		Summary of Registration results  
Table 5.14		Summary of Manual Data Entry results  
Table 5.15		Summary of Manual Data Entry results  
Table 5.16		Summary of Manual Data Entry results  
Table 5.17		Questionnaire Response Key  
Table 5.18		Summary of Likert Scale responses  
Table 6.1.1		Registration Use Case  
Table 6.1.2		Login Use Case  
Table 6.1.3		Logout Use Case  
Table 6.1.4		Admin View System Statistics Use Case  
Table 6.1.5 		Admin View User List Use Case  
Table 6.1.6 		Admin Deactivate User Use Case  
Table 6.1.7 		Admin Activate User Use Case  
Table 6.1.8		Doctor View Alert Summary Use Case  
Table 6.1.9		Doctor View Patient List Use Case  
Table 6.2.1 		Doctor Query for Patients Use Case  
Table 6.2.2		Doctor View Patient Details Use Case  
Table 6.2.3 		Doctor View Vital Signs Use Case  
Table 6.2.4		Doctor View Scheduled Appointments Use Case  
Table 6.2.5		Doctor Manage Follow Ups Use Case  
Table 6.2.6 		Patient View Dashboard Use Case  
Table 6.2.7		Patient View Biometric Data Use Case  
Table 6.2.8		Patient Add Manual Data Entry Use Case  
Table 6.2.9 		Table 6.2.9 Doctor View Biometric Data Use Case  
Table 6.3.1		Patient View Appointments Use Case  
Table 6.3.2		Patient View Medication Use Case

Figure List  
Figure 1.1		Admin Dashboard Use Case  
Figure 1.2		Doctor Dashboard Use Case  
Figure 1.3		Patient Dashboard Use Case  
Figure 2.1	 	Stage 1 Gantt Chart  
Figure 2.2 		Stage 2 Gantt Chart  
Figure 3.1		Activity Diagram for Registration  
Figure 3.2 		Activity Diagram for Login  
Figure 3.3		Activity Diagram for Logging out  
Figure 3.4		Activity Diagram for Admin Use Case 1  
Figure 3.5		Activity Diagram for Admin Use Case 2 to 4  
Figure 3.6		Activity Diagram for Patient Use Case 1 to 4  
Figure 3.7		Activity Diagram for Patient Use Case 1 to 4  
Figure 3.8		Activity Diagram for Doctor Use Case 1  
Figure 3.9.1		Activity Diagram for Doctor Use Case 2 to 3  
Figure 3.9.2		Activity Diagram for Doctor Use Case 4 to 5  
Figure 3.9.3		Activity Diagram for Doctor Use Case 6 to 7  
Figure 4.1		Sequence Diagram for Registration  
Figure 4.2		Sequence Diagram for Login  
Figure 4.3		Sequence Diagram for Logout  
Figure 4.4		Sequence Diagram for Admin  
Figure 4.5		Sequence Diagram for Doctor  
Figure 4.6		Sequence Diagram for Patient Use Case 1 to 4  
Figure 4.7		Sequence Diagram for Patient Use Case 5 and 6  
Figure 5.1		Gantt Chart Table Stage I  
Figure 5.2		Gantt Chart Stage 1  
Figure 5.3		Gantt Chart Stage 2  
Figure 5.4		Gantt Chart Stage 2  
Figure 5.5		Gantt Chart Stage 2  
Figure 5.6		Gantt Chart Stage 2  
Figure 5.7		Gantt Chart Stage 2  
Figure 6.1.1		Pre-test Questionnaire Screenshot 1  
Figure 6.1.2		Pre-test Questionnaire Screenshot 2  
Figure 6.1.3		Pre-test Questionnaire Screenshot 3  
Figure 6.1.4		Pre-test Questionnaire Screenshot 4  
Figure 6.1.5		Pre-test Questionnaire Screenshot 5  
Figure 6.1.6		Pre-test Questionnaire Screenshot 6  
Figure 6.2.1		Post-test Questionnaire Screenshot 1  
Figure 6.2.2		Post-test Questionnaire Screenshot 2  
Figure 6.2.3		Post-test Questionnaire Screenshot 3  
Figure 7.1.1		Figma Prototype Registration Page Screenshot  
Figure 7.1.2		Figma Prototype Sign in Page Screenshot  
Figure 7.2.1		Figma Prototype Patient Dashboard Page Screenshot  
Figure 7.2.2		Figma Prototype Patient Dashboard Page Screenshot 2  
Figure 7.2.3 		Figma Prototype Patient Dashboard Manual Biomarker Entry Page Screenshot  
Figure 7.2.4		Figma Prototype Patient Manual Biomarker First Entry Entry Page Screenshot   
Figure 7.2.5		Figma Prototype Patient Dashboard in Dark Mode Screenshot  
Figure 7.3.1		Figma Prototype Doctor Dashboard Screenshot  
Figure 7.3.2		Figma Prototype Doctor Dashboard with a Specific Patient View Screenshot  
Figure 7.3.3		Figma Prototype Doctor Dashboard with Appointments View Screenshot  
Figure 7.3.4		Figma Prototype Doctor Dashboard with Matching Search Screenshot  
Figure 7.3.5		Figma Prototype Doctor Dashboard in Dark Mode Screenshot  
Figure 7.4.1		Figma Prototype Admin Dashboard Screenshot  
Figure 7.4.2		Figma Prototype Admin Dashboard Role Assignment Screenshot  
Figure 7.4.3		Figma Prototype Admin Dashboard Account Status Change Screenshot  
Figure 7.4.4		Figma Prototype Admin Dashboard in Dark Mode Screenshot  
Figure 8		Consent Form

Acronyms and Definitions  
Table of Acronyms 

| Acronym | Definition |
| :---- | :---- |
| U-FR | User Functional Requirements |
| S-FR | System Functional Requirements |
| U-NFR | User Non-functional Requirements |
| S-NFR | System Non-Functional Requirements |
| TechR | Technology Risk |
| SecurityR | Security Risk |
| PeopleR | People Risk |
| EstimationR | Estimation Risk |
| OrganizationR | Organization Risk |
| (A)  | Avoidance |
| (C)  | Contingency plans |

#### 

Table of Data Definitions

| Term | Definition |
| :---- | :---- |
| Wearables | Small electronic devices with wireless communications capability designed to be worn on the human body and are incorporated into gadgets, accessories, or clothes. |
| Medical devices | An instrument, tool, machine, test kit, or implant that is used to prevent, diagnose, or treat disease or other conditions. |
| Healthcare providers | Doctors, clinics, or any organization providing health care services. |
| Biomarker data | Biomarkers are measurable characteristics that can be used to indicate the presence or absence of a disease or to track the progression of a disease. They can also be used to predict how a patient will respond to a particular treatment. |

### 

## Requirements

## Introduction  {#introduction}

As the population ages internationally and diseases arise, there is an immense demand for health management systems. Existing systems tend to be dated and ambiguous. Due to this, information collected from medical devices can be disconnected and dissociated from numerous platforms, complicating the data display process for healthcare professionals and individuals.

This document proposes the development of Healio, an interactive health monitoring platform that combines data from various wearables into a single, interconnected platform. This report details technical documentation and design considerations of the system. The system will be designed for consenting adults, providing user-friendly interactions to promote medical literacy and visualisable data in turn enhancing communication between users and healthcare providers.

## Purpose {#purpose}

The purpose of this project is to develop a website application of a virtual health monitoring system for everyday use. The system will gather biomarker data from a wide range of wearables, devices and medical applications and integrate them into one singular application. This information can then be presented to users in numerous forms, enabling users to monitor personal health through visual means. As a result of this, demonstrating how user engagement, medical care and data insights can be improved through such technologies.

## Scope {#scope}

The scope of the project is one fully functional stand-alone web application. The system includes a website and health management system. The main purpose of the website is to enhance user participation and display data to a variety of adult audiences and digital literacy levels.

The dashboard would enable end users to have biomarker data be uploaded by medical devices and professionals or the option to manually input biomarker data into the system. Accordingly, patients would then be able to view their own data. Medical professionals would be able to query their patient data on the platform and view visual analytics on patient biomarker data. The system would store basic account details, wearable device data, optional self-reported data and clinical data. Physiological data would be depicted through graphs and timelines. Furthermore, data privacy regulations and security laws would be followed to handle all data. 

## Aims {#aims}

The aim of the project is to create a virtual health companion system that helps users share data and achieve their health goals. The aim of this report is to provide an overview of the project's development, outlining key decisions, risks and risk management techniques implemented throughout the duration of the project. We will evaluate the user interface, and all usability requirements to ensure it meets diverse patient needs and aligns with safety, security, and clinical reliability standards.

## Objectives {#objectives}

The objectives of this project is:

* To develop a web-based health application that enables users to integrate wearable device information.  
* To gather and display medical data for both patients and clinicians.  
* To test system performance and usability to guarantee the platform is responsive and accessible for all adults.  
* To provide support to clinicians through a secure dashboard for reviewing patient health trends and records.

## Product Perspective 

The product is being developed for adult users and healthcare providers. The application enables data visualization and data integration from medical tracking.

## General Capabilities

The purpose of the system is to allow for assimilation of data between end users and medical devices in addition to manual patient data entry. Additional capabilities include simulation through data analysis and data display. This would enable healthcare providers to view patient data by query in a readable format and provide accurate diagnostics and insights. Moreover, patients would be able to individually access corresponding data visualisation tools. While administrators would manage the website in case technical maintenance is needed such as security issues and content inconsistencies.

### Data Integration

Wearable data would be collated in the application and analyzed for insights. Data input would include heart rate, calories, daily step intake, blood pressure measurements and blood glucose levels. Basic prefixed data such as height, weight and gender would be taken into account by registration then verified by healthcare providers.

### Data Visualisation

Users would be able to access personal records and have it be expressed in a visual format. This would be a dated timeline of individuals' medical records matched with optional manual data entered by clients. Healthcare providers would be able to access independent data records by inquiring the system, then visible comparisons would be made by the system itself.

## General constraints 

The project will be operating under constraints such as scope, time, cost, and quality, each accounted for to determine what will be delivered. All deliverables will meet agreed upon standards and follow the project timeline, with any adjustment in certain constraints requiring changes to others. The system’s functions will be accessible to patients and healthcare providers. Data integration may be limited by wearable compatibility, availability and restricted medical data access. Handling sensitive health information requires encryption, data regulation compliance, and informed consent. The interface will remain visually accessible and provide consistent design, while timeline limits require simulated data and exclude full clinical integration.

## User Characteristics 

The proposed application will be designed for a diverse user base. As the audience would vary from young adults to mature individuals who use wearables and medical devices, the application would be made accessible for all end users. In addition to this, data would be handled transparently and ethically with clear consent forms presented to users at registration.The only previous knowledge that would be assumed is that users have dealt with sign up and sign in interactions.

Patients  
The users would be able to access their own data and any data they manually inputted into the system. End users would be able to track progress on their vitals and view notifications sent by the system.

Healthcare Providers  
Healthcare providers would be able to ethically access their patients biomarker data and observe data visualizations to provide better patient care.

Administrators  
Administrators would ensure the website runs smoothly, uploaded data remains secure and all regulations are met

## Functional Requirements {#functional-requirements}

### User Functional Requirements {#user-functional-requirements}

Table 1.1 documents the functional requirements from the user side.

| ID | Requirement | MoSCoW |
| ----- | ----- | ----- |
| **U-FR-1** | **User Logins and Authentication** |   |
| U-FR-1-1 | Users must be able to register using their unique email. | M |
| U-FR-1-2 | Users must be able to login using their email and password. | M |
| U-FR-1-3 | Users should agree to the terms and conditions when registering their details. | S |
| U-FR-1-4 | Users must be able to contact the system administrator if they encounter any issues within the system. | M |
| U-FR-1-5 | Users must be able to logout of the system by themselves. | M |
| U-FR-1-6 | Users shall be able to change their password if needed. | S |
| U-FR-1-7 | Users must be able to log in using third-party accounts. | M |
| U-FR-1-8 | Users must be able to access features based on their assigned role such as Patient, Doctor, or Admin. | M |
| U-FR-1-9 | Users must be informed if they do not meet strong password requirements when creating or updating their password. | M |
| U-FR-1-10 | Users shall be automatically logged out after a period of inactivity for security reasons. | C |
| U-FR-1-11 | Users shall be notified if their account becomes temporarily locked after multiple failed login attempts. | C |
| U-FR-1-12 | Users shall be able to receive reminders related to their scheduled appointments. | C |
| **U-FR-2** | **Data Handling and Processing** |  |
| U-FR-2-1 | Users must be able to manually enter their health or biomarker data into the system. | M |
| U-FR-2-2 | Users must be able to view their data in the form of graphs, charts, or reports. | M |
| U-FR-2-3 | Users must be able to export their health reports in PDF or CSV formats. | M |
| U-FR-2-4 | Users shall be able to continue entering data even without internet connectivity, and have it sync when connection is restored. | C |
| U-FR-2-5 | Users shall be able to view contextual information such as weather or location data when it contributes to their health insights. | C |
| U-FR-3 | **Notifications and Communication** |  |
| U-FR-3-1 | Users must receive notifications about abnormal or critical biomarker readings. | M |
| U-FR-3-2 | Users must be able to understand alerts easily through visual cues such as icons or colour coding. | M |
| U-FR-4 | **Chatbot/ Virtual Health Assistant** |  |
| U-FR-4-1 | Users shall have access to an AI-based virtual health assistant within the website. | C |
| U-FR-4-2 | Users shall be able to ask health-related or general queries to the chatbot and receive responses. | C |
| U-FR-5 | **Gamification** |  |
| U-FR-5-1 | Users must have their gamification data linked to their unique ID so that their progress and achievements are stored securely. | M |
| U-FR-5-2 | Users should be able to earn points or badges when they complete specific health actions such as meeting daily steps or sleep goals. | S |
| U-FR-5-3 | Users should be able to view their streaks and monitor their progress within the app. | S |
| U-FR-5-4 | Users shall be able to view all the badges they have earned in a dedicated Achievements section. | C |
| U-FR-5-5 | Users shall be able to track milestone achievements such as reaching a workout target or completing consecutive active days. | C |
| U-FR-5-6 | Users shall receive motivational messages or health insights based on their achievements and progress. | C |

### System Functional Requirements {#system-functional-requirements}

Table 1.2 documents the functional requirements from the system side.

| ID | Requirement | MoSCoW |
| ----- | ----- | ----- |
| **S-FR-1** | **User Logins and Authentication** |   |
| S-FR-1-1 | The system must allow for third party login options | M |
| S-FR-1-2 | The system must provide access based on different roles: Patient, Doctor or Admin. | M |
| S-FR-1-3 | The system must ensure strong password policies | M |
| S-FR-1-4 | The system should allow for secure password resets via email. | S |
| S-FR-1-5 | The system should allow admins to monitor failed login attempts and lock compromised accounts. | S |
| S-FR-1-6 | The system shall allow users to logout themselves. | M |
| S-FR-1-7 | The system shall automatically log the users out after a set period of inactivity. | C |
| S-FR-1-8 | The system shall log all access attempts (successful or failed) with timestamps. | C |
| S-FR-1-9 | The system shall lock the account temporarily after five failed attempts. | C |
| S-FR-1-10 | The system shall allow users to add reminders of say scheduled appointments. | C |
| **S-FR-2** | **Data Handling and Processing** |  |
| S-FR-2-1 | The system must store patient biomarker data from manual entry or connected devices.  | M |
| S-FR-2-2 | The system must process and visualize data in the form of graphs, charts or reports. | M |
| S-FR-2-3 | The system must allow export of reports in the form of PDFs and CSV format. | M |
| S-FR-2-4 | The system shall handle offline entries and sync them when connectivity gets restored. | C |
| S-FR-2-5 | The system could allow integration of contextual information (e.g., weather, location, device accuracy) to provide more accurate health insights. | C |
| **S-FR-3** | **Notifications and Communication** |  |
| S-FR-3-1 | The system must notify users about abnormal biomarker readings. | M |
| S-FR-3-2 | The interface must use visual cues (icons, colour coding) to differentiate alerts, statuses. | M |
| **S-FR-4** | **Chatbot/ Virtual Health Assistant** |  |
| S-FR-4-1 | The system shall include a pre-defined AI \- driven chatbot available to all the users. | C |
| S-FR-4-2 | The chatbot will be capable of answering general and health related queries. | C |
| **S-FR-5** | **Gamification** |  |
| S-FR-5-1 | The gamification data must be linked to the user’s unique ID within the system database to maintain data integrity. | M |
| S-FR-5-2 | The system shall convert specific health actions (meeting daily steps, sleeping enough hours) into points or badges. | S |
| S-FR-5-3 | The system shall track streaks and display the progress. | S |
| S-FR-5-4 | The system shall display all earned badges in a dedicated “Achievements” section of the profile. | C |
| S-FR-5-5 | The system shall track milestone achievements such as 100 total workouts, 30 consecutive active days, or reaching a weight goal. | C |
| S-FR-5-6 | The system shall provide motivational messages or health insights along with achievement notifications. | C |
| **S-FR-6** | **Patient Dashboard and Monitoring** |  |
| S-FR-6-1 | The patient dashboard must display summaries of key biomarker readings like steps, calories, sleep hours. Each summary shall be tappable to open a detailed view. | M |
| S-FR-6-2 | The dashboard must provide time-series charts of selected metrics with filters. (day, week, month and custom ranges. | M |
| S-FR-6-3 | The system must display averages of selected metrics over the course of a week or month which allows for comparison and progress tracking. | M |
| **S-FR-7** | **Doctor Dashboard and Monitoring** |  |
| S-FR-7-1 | The doctor dashboard must display a summary list of all assigned patients with key indicators (e.g., latest glucose, heart rate, sleep) | M |
| S-FR-7-2 | The dashboard must allow quick search and selection of patients by name, ID, or condition. | M |
| S-FR-7-3 | The dashboard should display alerts for patients who have readings outside safe ranges. | S |
| **S-FR-8** | **Data Entry and Reports**  |  |
| S-FR-8-1 | The system must allow patients to manually enter their data (glucose, meals, exercise, weight, sleep hours) with timestamps and notes. | M |
| S-FR-8-2 | The system must validate data entry in accordance with acceptable ranges only. Invalid entries shall display error messages. | M |
| S-FR-8-3 | The system must allow the doctors to generate detailed reports of the patient’s health metric for the chosen period. | M |
| S-FR-8-4 | The system shall allow CSV/PDF imports of the patients reports or health data with validation and duplicate detection. | C |
| **S-FR-9** | **Alerts and Notifications** |  |
| S-FR-9-1 | The system should allow patients to configure their personal thresholds for biomarker alert. (like alert if glucose is above 150 or alert if glucose is above 130). | S |
| S-FR-9-2 | The system should notify patients of abnormal readings. | S |
| S-FR-9-3 | The system shall keep a record of all the alerts for the patient to review and acknowledge them. | C |
| S-FR-9-4 | The system will notify the doctor of any escalated alerts from the patients. | C |
| S-FR-9-5 | The system will maintain the history of alerts received. | C |
| S-FR-9-6 | The system shall provide priority flags for the patients needing urgent review. | C |
| **S-FR-10** | **Goals and Progress** |  |
| S-FR-10-1 | The system must allow the patients to set their health goals (step count, weight). | M |
| S-FR-10-2 | The system shall track the progress and display milestones and completion status. | C |
| **S-FR-11** | **Setting and Personalization** |  |
| S-FR-11-1 | The system shall allow patients to view and manage active sessions and remotely log out from other devices. | C |
| S-FR-11-2 | The system shall provide privacy controls for managing which clinicians or family members have access to their data. | C |
| S-FR-11-3 | The system shall allow users to configure their time zones and languages. | W |
| **S-FR-12** | **Patient Data Access** |  |
| S-FR-12-1 | The system should provide comparative views of patient data across time ranges (day, week, month, year). | S |
| S-FR-12-2 | The system shall allow doctors to view detailed patient dashboards, including biomarker history, goals, progress, and alert logs. | C |
| S-FR-12-3 | The system shall allow doctors to share feedback, or exercise/diet recommendations. | C |
| S-FR-12-4 | The system shall display medication logs (if provided by patient) alongside biomarker data for context. | C |
| S-FR-12-5 | The system shall maintain an audit log displaying when the doctor accessed the patient details. | C |
| S-FR-12-6 | The system shall provide the ability to filter patient groups (e.g., diabetic patients, cardiac patients) for easier monitoring. | C |
| **S-FR-13** | **Admin Role and Dashboard** |  |
| S-FR-13-1 | The system must allow admins to edit and deactivate accounts. | M |
| S-FR-13-2 | The system must allow admins to assign roles (patient, doctor, admin). | M |
| S-FR-13-3 | The dashboard could display statistics such as total users (patients and doctors), number of active sessions, and device connections. | C |
| S-FR-13-4 | The system shall maintain a full audit trail of account creations, modifications, and deletions. | C |
| S-FR-13-5 | The system shall provide a breakdown of gamification participation (most popular challenges, badge distribution). | W |

## Non-Functional Requirements {#non-functional-requirements}

### User Non-Functional Requirements {#user-non-functional-requirements}

Table 1.3 documents the non-functional requirements from the user side.

| ID | Requirement | MoSCoW |
| ----- | ----- | ----- |
| **U-NFR-1** | **Performance and Availability** |   |
| U-NFR-1-1 | Users should experience smooth interactions throughout the platform, with pages and features loading within a few seconds under normal conditions. | M |
| U-NFR-1-2 | Users must be able to use the system at the same time as other users without noticing slowdowns or disruptions. | M |
| U-NFR-1-3 | Users should see dashboards and important visual information load quickly so they can understand their health data without delay. | S |
| U-NFR-1-4 | Users should not feel the website becoming slower over time as more of their health information is added. | C |
| U-NFR-1-5 | Users should receive results from background operations, like report generations, within a short and reasonable waiting period. | C |
| **U-NFR-2** | **Security** |  |
| U-NFR-2-1 | Users should feel confident that all their personal and health data is stored securely and is protected from unauthorised access. | M |
| U-NFR-2-2 | Users should only be able to access information relevant to their own account and role, ensuring that sensitive data remains private. | M |
| U-NFR-2-3 | Users should know that their passwords are stored safely using modern and secure hashing algorithms. | M |
| U-NFR-2-4 | Users should be protected from common security threats such as malicious links, unauthorised scripts, or harmful requests. | S |
| **U-NFR-3** | **Usability and Accessibility** |  |
| U-NFR-3-1 | Users should be able to navigate the system easily thanks to a clean and consistent design | M |
| U-NFR-3-2 | Users should be able to use the platform comfortably on any device, whether on a mobile phone, tablet, or desktop. | S |
| U-NFR-3-3 | Users should be able to switch between light and dark mode depending on their visual preference. | C |
| **U-NFR-4** | **Reliability** |  |
| U-NFR-4-1 | Users should trust that essential actions, such as registering, updating data, or saving entries, always complete successfully without errors. | M |
| U-NFR-4-2 | Users should feel assured that their information is safe through regular system backups, preventing loss of important data. | S |
| **U-NFR-5** | **Maintainability** |  |
| U-NFR-5-1 | Users should benefit from stable and predictable system behaviour thanks to well-structured and properly documented code. | M |
| U-NFR-5-2 | Users should expect new health features or improvements to be added smoothly without affecting the parts of the system they already rely on. | S |
| **U-NFR-6** | **Data Integrity and Accuracy** |  |
| U-NFR-6-1 | Users should be guided to enter correct and meaningful information through proper input validation. | M |
| U-NFR-6-2 | Users should receive accurate calculations and insights (such as averages or progress tracking) that remain reliable over time. | S |
| U-NFR-6-3 | Users should be able to view their information in the correct order thanks to accurate timestamps on all entries. | C |

### System Non-Functional Requirements  {#system-non-functional-requirements}

Table 1.4 documents the non-functional requirements from the system side

| ID | Requirement | MoSCoW |
| ----- | ----- | ----- |
| **S-NFR-1** | **Performance and Availability** |   |
| S-NFR-1-2 | System response time for all user-facing interactions must not exceed 5 seconds under normal load conditions. | M |
| S-NFR-1-2 | The system must support concurrent users without performance degradation. | M |
| S-NFR-1-3 | All primary dashboard visualizations should render completely within 2 seconds under standard network conditions | S |
| S-NFR-1-4 | System performance could not degrade as patient data history grows. | C |
| S-NFR-1-5 | Asynchronous background tasks, such as standard report generation, could be completed within 10 seconds. | C |
| **S-NFR-2** | **Security** |  |
| S-NFR-2-1 | All data must be encrypted. | M |
| S-NFR-2-2 | The system must enforce a strict role-based access control (RBAC) model. Patients can only view their own data. Clinicians can only view data for patients explicitly assigned to them. | M |
| S-NFR-2-3 | User passwords must be salted and hashed using a strong, adaptive one-way hashing algorithm. | M |
| S-NFR-2-4 | The system shall employ protection mechanisms against SQL injection, XSS, and CSRF attacks. | S |
| **S-NFR-3** | **Usability and Accessibility** |  |
| S-NFR-3-1 | The user interface must adhere to a consistent design system to ensure a predictable and intuitive user experience. | M |
| S-NFR-3-2 | The application shall feature a responsive design that provides an optimal viewing experience across a range of devices, from mobile phones to desktop monitors. | S |
| S-NFR-3-3 | The system could provide both light and dark mode for accessibility comfort. | C |
| **S-NFR-4** | **Reliability** |  |
| S-NFR-4-1 | All critical operations must be executed as an atomic transaction.  | M |
| S-NFR-4-2 | The system shall implement timely data backups. | S |
| **S-FR-5** | **Maintainability** |  |
| S-FR-5-1 | All code must be documented following a consistent, predefined standard. | M |
| S-FR-5-2 | The system should allow adding new health parameters or gamification features without affecting existing modules. | S |
| **S-FR-6** | **Data Integrity and Accuracy** |  |
| S-FR-6-1 | Input validation must be enforced at both the client and server levels to maintain data integrity. | M |
|  | All calculations (averages, progress tracking, comparisons) should be consistent and verified through testing. | S |
| S-FR-6-2 | The system could record timestamps for every entry to ensure chronological integrity. | C |

## Use Case Diagrams {#use-case-diagrams}

Use case diagrams were constructed for the admin dashboard, the doctor dashboard and the patient dashboard. The diagrams were constructed using the [use case specifications](#use-case-specifications) created and mentioned in the Appendix.

Admin Dashboard  
Figure 1.1 Admin Dashboard Use Case

![][image1]

Doctor Dashboard   
Figure 1.2 Doctor Dashboard Use Case  
![][image2]  
Patient Dashboard  
Figure 1.3 Patient Dashboard Use Case

## Risk Analysis

## Risk Management Approach {#risk-management-approach}

Risk management is a proactive and systematic process essential for the successful delivery of the Virtual Health Companion project. Our approach consists of following 4 main steps: Identification, Analysis, Planning, and Monitoring. We begin by presenting possible risks that may affect the success of the project, then analyze their probability and impact on the project. After a successful analysis, we begin to look for the best ways to prevent these risks, how we can mitigate their consequences or even backup options in case of unforeseen circumstances. We also monitor risks throughout the project by adjusting our strategies to reduce project timelines, budget and quality.

### Risk categorizing

1. Project risk: May affect project schedule, resources and management  
* Estimation Risks (EstimationR): inaccuracy in predicting time or recurses  
* People Risks (PeopleR): related to team dynamic, availability and skills  
* Organization Risks (OrganizationR): stem from the external project environment and stakeholders  
2. Product Risks: affect the quality, performance, or security of the software being developed  
* Requirements Risks (RequirementR): caused by requirements that are ambiguous, dynamic, or lacking  
* Technology Risks (TechR): associated with the software, hardware, and integration of other technologies  
* Security & Privacy Risks (SecurityR): specific to the handling of sensitive health data

### Risk documentation {#risk-documentation}

Table 2.1 Risk Documentation

| ID | Risk Description | Risk Type |
| ----- | ----- | ----- |
| RK-1 | **Cloud hosting outage:** An outage or slowdown with the cloud provider prevents the group from accessing the backend environment, blocking development tasks such as feature testing, deployment, and integration work. | TechR |
| RK-3 | **Security & Privacy Breach**: A vulnerability leads to unauthorized access to highly sensitive health data, violating general security guidelines or principles and damaging user trust | SecurityR |
| RK-5 | **Team Skill Gap**: The team lacks expertise in secure authentication, chatbot development, and web deployment, or data visualization libraries | PeopleR |
| RK-6 | **Scope Creep from Feature Complexity**: The combination of gamification, a chatbot and multi-role dashboards leads to an underestimated workload and timeline | EstimationR |
| RK-7 | **Team Unavailability**: Key team members become unavailable, halting progress on critical components they are solely responsible for | PeopleR |
| RK-9 | **Client response delay**: The development process may be interrupted by requirements changes brought about by stakeholder feedback | OrganizationR |
| RK-10 | **Unclear Multi-Role Permissions**: Confusion in implementing the fine-grained access control between Patients, Doctors, and Admins, leading to security flaws or a poor user experience | PeopleR |
| RK-11 | **Underestimated Testing Effort**: The number of test cases for data validation, user roles, wearable integrations, and the chatbot is vastly larger than anticipated | EstimationR |
| RK-12 | Changes in the project plan or schedule may lead to delays and confusion during system development. | OrganizationR |
| RK-13 | Unclear task distribution or overlapping responsibilities amongst the group may reduce overall eﬃciency. | PeopleR |

### Risk Identification {#risk-identification}

Table 2.2 Risk Priority Key

| Risk Priority | Color |
| :---- | :---- |
| High |  |
| Medium |  |
| Low |  |

Table 2.3 Risk Prioritisation

| ID | Shortened Risk Description | Probability  | Impact | Priority |
| ----- | ----- | ----- | ----- | ----- |
| RK-3 | Security & Privacy Breach | High | Critical |  |
| RK-6 | Scope Creep from Feature Complexity | High | Serious |  |
| RK-5 | Skill Gap in Security, AI, or Web Dev | Moderate | Tolerable |  |
| RK-11 | Underestimated Testing Effort | High | Serious |  |
| RK-10 | Unclear Multi-Role Permissions | Moderate | Serious |  |
| RK-1 | Cloud hosting outage: | Moderate | Serious |  |
| RK-12 | Project Plan or Schedule Changes | Moderate  | Serious |  |
| RK-13 | Unclear Task Distribution  | Low | Serious |  |
| RK-7 | Team Unavailability | Low | Tolerable |  |
| RK-9 | Client response delay | Low | Tolerable |  |

#### 

Risk Planning  
Note: (A) represents Avoidance, and (C) represents Contingency plans.  
Table 2.4 Risk Planning

| ID | Plans | Strategies |
| :---- | :---- | :---- |
| RK-1 | A | Use AWS status dashboards and monitoring tools to stay aware of ongoing service issues. Where possible, keep local development environments so the team can continue coding even if the cloud service becomes unavailable. |
|  | C | If AWS goes down, switch temporarily to a local server or offline testing environment. Pause deployment-related tasks and focus on sections of the project that do not rely on cloud hosting. |
| RK-3 | A | Encrypt all data. Use professional auth services Limit data access. |
|  | C | Force password reset if breached. Use fake data for testing |
| RK-5 | A | Check team skills early. Pair programmers. Use easy backend services. |
|  | C | Remove complex features if needed. Focus on what team does well. |
| RK-6 | A | Build "Must-Have" features first. Delay nice-to-have items. |
|  | C | Cut low-priority features if behind schedule. |
| RK-7 | A | Two people should know each key task. Share schedules. |
|  | C | Move tasks to others. Focus on finishing, not starting new. |
| RK-9 | A | Set fixed meeting times for feedback. Require written change requests. |
|  | C | Swap new requests for old low-priority tasks. |
| RK-10 | A | Draw user permission maps before coding. |
|  | C | If complex, use simple "Admin/User" roles instead. |
| RK-11 | A | Write tests for key features (login, data entry). |
|  | C | Test only critical features if time is short. List untested parts. |
| RK-12 | A | Finalize a detailed project plan early and document all milestones, deadlines, and dependencies. |
|  | C | If sudden changes occur, quickly update the plan, redistribute tasks according to the new timeline, and hold a meeting to realign the team and ensure everyone understands the revised objectives. |
| RK-13 | A | Define each team member’s roles and responsibilities clearly at the start of the project to ensure there is no overlap or confusion in tasks. Use a shared project document to track who is working on what. |
|  | C | If confusion or overlap occurs, reorganize the work plan quickly by redistributing tasks according to team members’ strengths and availability to restore eﬃciency and keep the project on schedule. |

### Risk Monitoring {#risk-monitoring}

Table 2.5 Risk Monitoring

| ID | Warning Signs | Monitoring Method |
| :---- | :---- | :---- |
| RK-1 | Backend failing to load, deployment errors, or AWS dashboard showing service interruptions. | Check AWS service health dashboard regularly and monitor backend performance logs during development. |
| RK-2 | User feedback reporting strange or incorrect chatbot answers; test cases failing for pre-defined responses. | Log all chatbot interactions during testing for weekly review. Manually test response set in each iteration. |
| RK-3 | Failed security scans; unexpected user permission errors; unauthorized access attempts in audit logs. | Run automated security scans weekly. Manually test user role permissions in every sprint review. |
| RK-4 | Charts failing to load; application crashing on data entry; file import errors; data validation not triggering. | Test the entire data pipeline (entry \-\> storage \-\> display) in every new build. |
| RK-5 | Certain tasks consistently behind schedule; low code quality in specific modules; team members asking for basic help. | Track task progress and code review feedback in weekly sprint meetings. Conduct a mid-project skills check-in. |
| RK-6 | Team working on "Could-Have" features before "Must-Haves" are complete; missed deadlines for core features. | Review the project task board in weekly meetings to ensure priority order is being followed. |
| RK-7 | Team members missing deadlines or meetings; tasks not started due to owner absence. | Use a shared team calendar. Track task progress and individual availability in weekly stand-up meetings. |
| RK-8 | Inconsistent UI between platforms. | Perform testing on all platforms with every feature update. |
| RK-9 | Unclear feedback from stakeholders; last-minute change requests; confusion about approved features. | Document all feedback and decisions in meeting minutes. Maintain a formal change log. |
| RK-10 | Users seeing data they shouldn't; admins unable to manage roles; permission errors in console. | Conduct weekly manual tests of all user roles (Patient, Doctor, Admin) to verify access controls. |
| RK-11 | A high number of bugs found late; critical features untested before demo; rushed testing phases. | Track test case completion and bug count metrics weekly. Ensure testing is included in the sprint goal. |
| RK-12 | Frequent changes to the plan, unclear timelines, or confusion about current project goals. | Review the project plan during weekly team meetings, maintain a change log of all schedule adjustments, and communicate updates immediately to all members. |
| RK-13 | Team members unsure about their assigned roles, overlapping tasks, or confusion regarding responsibilities | Review task assignments weekly, clarify roles in meetings, and update task distribu3on in the project documenta3on whenever changes occur |

## 

## Project Decisions and Plan

### Technological Choices, Software and Tools  {#technological-choices,-software-and-tools}

* We will be using VS Code as the code editor to build the application.  
* The **Frontend** will be created with a combination of HTML, CSS, and JavaScript \- all of which produce a responsive, accessible interface on desktop and mobile.  
* The **Backend** will be developed using Python for its development speed.   
* The team decided to use MongoDB as the data storage, as a NoSQL database. This allows the addition of new features and fields over time.  
* The system will be hosted on Amazon Web Services (AWS), which provides reliable scalability and data security. It is the most cost efficient option,   
* User interface mock-ups and system wireframes will be developed using Figma.  
* All source code and documentation will be maintained in a shared GitHub repository. 

## System Structure And Top Level Design {#system-structure-and-top-level-design}

The application is organized into three subsystems. Patient, Doctor, and Admin, supported by a shared database and cloud infrastructure.

### Patient Module

The patient subsystem enables users to manage their personal health information.  
Key features include:

* Registering and authenticating accounts.  
* Manually entering or biomarker readings such as steps, heart rate, and calories.  
* Viewing daily, weekly, and monthly summaries through an interactive dashboard.  
* Sorting and filtering data by time periods to observe progress.

### Doctor Module

### The doctor subsystem provides healthcare professionals with controlled access to patient information.

Key features include:

* Viewing a list of assigned patients.  
* Accessing detailed biomarker data for each patient.  
* Monitoring abnormal readings or trends that may require medical attention.

### Admin Module

The admin subsystem manages the overall system environment and user accounts.  
Main operations involve:

* Adding or removing patients and doctors.  
* Maintaining data integrity by verifying user roles.  
* Monitoring system performance and managing access rights.

The admin module ensures smooth coordination between patient and doctor functionalities while maintaining system security and consistency of the platform.

### System Type And Platform Choice {#system-type-and-platform-choice}

The system will be developed as a web application. This approach allows users to access the system securely through any modern browser on desktop or mobile devices . Hosting the system on AWS Cloud supports scalability and reliability, while updates can be deployed centrally, providing a seamless and efficient experience for all users.

### Development Methodology {#development-methodology}

The project will use the Agile development methodology and focus on iterative progress. Agile divides the work into smaller stages that include planning, development, testing, and review, allowing continuous feedback and improvement. Regular communications and meetings help to identify any issues early, ensuring the system’s functionality and interface improve after each sprint.  
Team meetings, both in person and online, will track progress, assign upcoming tasks, and address any challenges. Every member is expected to participate actively, share updates, and report issues. Overall, the Agile approach encourages collaboration, accountability, and adaptability, which the final product meets user needs and project goals 

### Project Management Utilities {#project-management-utilities}

To ensure effective coordination and progress tracking throughout the project, the team will use a range of project management and collaboration tools. These tools support task organization, documentation, and communication between all members, which helps in each stage of development. Google Docs will be used for collaborative writing and maintaining shared documents such as specifications, meeting notes, and report drafts. This helps real-time editing and feedback from multiple members simultaneously. In addition, WhatsApp will be used for quick communication and meeting coordination, allowing members to stay updated on any urgent issues or changes. The task manager will maintain an organized record of weekly tasks and progress which ensures that the project remains on track with the intended timeline.

Intended Audience  
The primary audience consists of patients who use the system to monitor and track their daily health indicators, such as steps, calories, and other biomarker data. The application goal is to support individuals in maintaining a healthy lifestyle through continuous feedback and visual summaries of their progress. The secondary audience includes healthcare professionals, such as doctors, who can access and review patient data through the doctor dashboard.

### Team Roles {#team-roles}

Tables 3.1 and 3.2 show the contribution of each member of the team to each part that they have agreed on based on their strengths and weaknesses. Table 3.1 shows the former roles for Stage 1, whereas Table 3.2 shows the development roles for Stage 2\.

Table 3.1 Team Roles A

| Stage 1 Roles | Name |
| ----- | ----- |
| Project Leader | Hayden D SILVA |
| Task Manager | Juhi Malhotra |
| Requirement Analyst | Nayela Ehtesham, Hayden D SILVA, Juhi Malhotra, Aahil Razack, Ashraf Ipali |
| Risk Analyst | Iaroslav Zhutaev, Ashraf Ipali |
| Project Costing Lead | Hayden D SILVA |
| Project Decision and Planning | Sayyed Farisy |
| UI/UX Prototype Designer | Nayela Ehtesham |
| System Analyst  | Aahil Razack, Juhi Malhotra, Nayela Ehtesham |
| Usability Analyst | Iaroslav Zhutaev, Abdullah Shaikh |
| Report Structurer | Juhi Malhotra |

Table 3.2 Team Roles B

| Development Roles | Name |
| ----- | ----- |
| Project Leader | Hayden D SILVA |
| Front-End Developer | Juhi Malhotra, Iaroslav Zhutaev, Ashraf Ipali |
| Back-End Developer | Hayden D SILVA, Nayela Ehtesham,Aahil Razack |
| UI/UX Designer | Sayyed Farisy, Ashraf Ipali |
| Tester | Abdullah Shaikh, Sayyed Farisy  |

This collaborative structure ensures that each member contributes effectively within their area of responsibility while maintaining transparency and consistent communication across the team.

### Project Timeline And Task Allocation {#project-timeline-and-task-allocation}

During Stage 1 of the project, the team focused on research, planning, and documentation. Each member was assigned specific responsibilities based on their strengths and interests. The tasks were distributed evenly to ensure collaborative contribution to the report. Weekly meetings were conducted to discuss progress, review completed sections, and plan upcoming tasks. The project timeline is represented below in the Gantt charts.

### Gantt Charts {#gantt-charts}

While this figure shows the project timeline, the complete, detailed task list for Stage 1 is available in the "[Gantt Chart Table Stage I](#gantt-chart-table-stage-i)" section of the Appendix.

Figure 2.1 Stage 1 Gantt Chart  
![][image3]

Figure 2.2 Stage 2 Gantt Chart  
![][image4]

### Summary 

The project has successfully completed its first stage of planning and decision-making. The team has built a solid base by choosing the right tools and technologies, defining what the system should do, and assigning tasks to each member. We used several platforms to communicate and work together effectively, following an Agile approach that helped us stay flexible and make improvements as we go. A clear timeline and Gantt chart were created to track all Stage 1 tasks. Overall, Stage 1 has given the team a strong starting point for the next part of the project. Everyone understands their roles, the goals are clear, and the plan is well-organised. The next step will be to build an actual prototype, gather user feedback, and make further improvements in Stage 2\.

## Project Costing

This section shows a brief breakdown of the costs in implementing the healthcare companion application.

## Cost Analysis {#cost-analysis}

### People

* Project leader: Oversee the entire team, make sure tasks and projects are completed on time, and maintain the quality of the work.  
* UI/UX Designer: Designs the visual layout of and user experience of the software.  
* Front-end developers: Develops the visual and interactive parts of the software.  
* Back-end developers: Responsible for creating and maintaining the software’s business logic and server-side tasks.  
* Testers: Ensures quality control by testing the app.

### Hardware

* Workstations: Ensures that each member can work on each of their individual tasks. Used for development and testing.  
* Mobile Phones: For usability testing.

### Software and Usage

* Google Cloud: Using its virtual machine services to run business logic  
* Storage and Usage: To store user and transfer user data

## Calculations {#calculations}

### Salary Costs {#salary-costs}

Table 4.1 Summary table of Salary costs

| No. | Role | Hours | Number of employees | Hourly wage | Expected Cost |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Project leader | 300 | 1 | 140 AED | 42,000 AED |
| 2 | UI/UX Designer | 300 | 2 | 85 AED | 51,000 AED |
| 3 | Front-end developers | 300 | 2 | 125 AED | 75,000 AED |
| 4 | Back-end developers | 300 | 2 | 130 AED | 78,000 AED |
| 5 | Testers | 300 | 1 | 75 AED | 22,500 AED |

10 hours per week for 30 weeks  
Total Salary Costs: 268,500 AED

### Hardware Costs {#hardware-costs}

Table 4.2 Summary table of hardware costs

| No. | Item | Units | Cost | Expected Costs |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Workstations | 8 | 6,900 AED | 55,200 AED |
| 2 | Mobile phones (testing) | 2 | 4,500 AED | 9,000 AED |

Total Hardware Cost: 64,200 AED

### Software Costs {#software-costs}

Table 4.3 Summary table of software costs

| No. | Item | Units | Cost | Expected Costs |
| :---- | :---- | :---- | :---- | :---- |
| 1 | {The project management app} | 1 |  Free |  0 AED |
| 2 | Google Cloud (VM) | 1 | 90 AED | 90 AED |
| 3 | Storage Cost | 10 GB | 8 AED | 80 AED |
| 4 | Usage Cost | 30 GB | 44 | 1,320 AED |

Total Software Costs: 1,490 AED

### Overall Costs {#overall-costs}

Table 4.4 Summary table of overall costs

| No. | Costs | Expected Costs |
| :---- | :---- | :---- |
| 1 | Salary Cost | 268,500 AED |
| 2 | Hardware Cost | 64,200 AED  |
| 3 | Software Cost | 1,490 AED |

Total Cost: 334,190 AED

## Usability

## Usability Test Plan {#usability-test-plan}

### Objective {#objective}

These tests are designed to test whether the application is functional and intuitively understandable to users. Checking these criteria will help us to check with random people in a patient role. The experiment can be considered successful if at least 80% of participants are able to perform tasks independently without external support and give positive feedback.

### Specific Aims {#specific-aims}

1. To evaluate the high-fidelity prototype of the application.  
2. To gather user feedback on the dashboard design, data visualization, and navigation.  
3. To identify usability problems and functional bugs before development is finalized.  
4. To validate that critical user requirements (e.g., U-FR-1-1,U-FR-1-2,U-FR-2-1, S-FR-6-1) are met.

(See the "Figma" section of the Appendix for screenshots of the prototype used).

### Methodology {#methodology}

We will employ a task-based usability testing approach. We then ask the participants to talk about their actions while they are doing some of the tasks from the test plan. Key metrics, such as their comments, actions and difficulties will be recorded by our team. After completing each task, our teammates will rate participant attempts on a certain scale.

Participants were given a pre-test and post-test questionnaire to gather demographic data and subjective feedback. Blank copies of these questionnaires are available in the "Questionnaire" section of the Appendix.

### Participants {#participants}

We will recruit a group of 10-12 people of different ages (Ages 18 and above), fields of activity and computer proficiency, for the most accurate possible coverage of users. Different age groups and different levels of computer and mobile phone proficiency will help us to pinpoint the possible difficulties in working with our application, as our goal is to make it easy to use for everybody.

### Test Scenarios and Tasks {#test-scenarios-and-tasks}

Table 5.1 Table describing Task Scenarios and related functional requirements

| ID | Scenario & Task Description | Related Functional Requirements |
| ----- | ----- | ----- |
| T1 | Onboarding: You are a new user. Please register for an account on the Virtual Health Companion. | U-FR-1-1, U-FR-1-2 |
| T2 | Data Entry: You want to log your daily health metrics. Manually enter your heart rate and blood pressure readings for today. | U-FR-2-1, S-FR-8-1, S-FR-8-2 |
| T3 | Dashboard & Data Visualization: On your patient dashboard, find a chart showing your step count over the past week. | S-FR-6-1, S-FR-6-2, U-FR-2-2 |
| T4 | System Logout: You have finished using the application. Please log out of your account securely. | U-FR-1-5, S-FR-1-6 |

The completion of each task will be assessed by the assistance on the following scale:

1. Successful: No help required.  
2. Required Assistance: Needed minor prompting or clarification.  
3. Unsuccessful: Could not complete the task even with assistance.

### Metrics & Data Collection {#metrics-&-data-collection}

* ### Percentage of tasks successfully completed.

* ### Number of incorrect actions or paths taken per task.

* ### Time taken to complete each task (measured for efficiency).

* ### Scores from the post-test SUS questionnaire and qualitative feedback from the interview.

## Usability Test Protocol {#usability-test-protocol}

Tester: \_\_\_\_\_\_\_\_\_  
Date: \_\_\_\_\_\_\_\_\_  
Time: \_\_\_\_\_\_\_\_  
Location: \_\_\_\_\_\_\_\_\_  
Participant: \_\_\_\_\_\_\_\_\_ (Role: Patient / Doctor)  
Prototype Version: Figma Hi-Fi Mock-up

### Aim of this Test {#aim-of-this-test}

The purpose of this test is to understand how users interact with the Virtual Health Companion website. Your feedback is important for improving the application's functionality, clarity, and overall user experience before we begin development. We are testing the prototype, not you, so there are no right or wrong answers.

### Introduction & Consent

Before the test, participants were given an explanation of the study and were required to sign the project consent form. A blank copy of this form is available in the "Consent form" section of the Appendix.

" Hello, thank you for your participation. We are testing a prototype website to monitor vital health indicators. Please complete a series of tasks by speaking your actions by ear, and if possible, describing your feelings when performing each action. We will record everything that happens during the test. The time of passage is about 10 minutes. You can stop at any time. Do you have any questions before we start? "

### Task 1: Registration

“Imagine you are new to this service. Please show how you would create a new account.”  
Do you find the registration link?

1. Successful      2\.	    Required assistance       3\.       Unsuccessful

### Task 2: Manual Data Entry

“You want to log your health data for today. Please enter your current heart rate and blood pressure manually.”  
Can you find the data entry feature? Is the form intuitive?

1. Successful     2\.     Required assistance      3\.       Unsuccessful

### Task 3: Viewing Data on Dashboard

“Now, without using the navigation menu, can you find a chart that shows your step count over the last week?”  
Is it easy to understand?

1. Successful      2\.      Required assistance      3\.      Unsuccessful

### Task 4: Logging Out

“You are finished using the application for now. Please log out of your account.”  
Can you find the logout option easily?

1. Successful      2\.     Required assistance      3\.       Unsuccessful

## Usability results {#usability-results}

### Test subject demographics {#test-subject-demographics}

Table 5.2 Usability test results for Gender

| Gender |  |
| :---: | :---: |
| Man | 7 |
| Woman | 8 |
| **Total** | **13** |

Table 5.3 Usability test results for Age

| Age |  |
| :---: | :---: |
| 18-24 | 12 |
| 25-30 | 3 |
| **Total** | **15** |

Table 5.4 Usability test results for Field of study

| Field of study |  |
| :---: | :---: |
| Computer science/ IT | 6 |
| Engineering | 4 |
| Business/Management | 3 |
| Humanities/Social science | 2 |
| **Total** | **15** |

 Table 5.5 Usability test results for Technical Ability

| Rate of comfort with new mobile apps and websites |  |
| :---: | :---: |
| Very Comfortable | 8 |
| Comfortable | 6 |
| Normal | 1 |
| **Total** | **15** |

 Table 5.6 Usability test results for Application and Device Usage

| Usage of apps or devices to track health  |  |
| :---: | :---: |
| Yes | 10 |
| No | 5 |
| **Total** | **15** |

Table 5.7 Usability test results for Most Frequently checked data

| The most frequently checked data |  |
| :---: | :---: |
| Steps | 9 |
| Heart Rate | 5 |
| Calories | 4 |
| Sleep | 6 |
| Workouts | 5 |

Table 5.8 Usability test results for Preferences in type of website

| Preferences in type of website |  |
| :---: | :---: |
| Mobile applications | 9 |
| No preference | 6 |
| **Total** | **15** |

   
Table 5.9 Usability test results for if User was willing to manually enter data

| User’s will to  manually enter data |  |
| :---: | :---: |
| Very willing | 4 |
| Willing | 5 |
| Moderate | 5 |
| Not willing | 1 |
| **Total** | **15** |

   
Table 5.10 Usability test results for Gamification

| Gamification |  |
| :---: | :---: |
| Very Motivating | 6 |
| Motivating | 9 |
| **Total** | **15** |

Table 5.11 Usability test results for Gamification 

| Sharing data |  |
| :---: | :---: |
| Very comfortable | 2 |
| Comfortable | 6 |
| Neutral | 6 |
| Uncomfortable | 1 |
| **Total** | **15** |

Table 5.12 Usability test results for Accessibility feature usage

| Usage of accessibility features |  |
| :---: | :---: |
| Yes | 6 |
| No | 6 |
| Sometimes | 3 |
| **Total** | **15** |

### Task 1: Registration

All participants were able to figure out what they should do to register in the system and found the design intuitively understandable. Users have figured out where to enter their registration data.  
*Sample comment*: “Everything was clear.”  
Table 5.13 Summary of Registration results

| Successful | Help required | Unsuccessful |
| :---: | :---: | :---: |
| 15 | 0 | 0 |

###  Task 2: Manual data entry

Most users immediately understood what was displayed on the main screen and how to enter values for recording. However, some of the participants struggled on this task by entering data longer than expected. The problem was that they could not immediately understand where to go to enter biometrics  
*Sample comment*: “I had trouble entering data because this function was not obviously labeled.”

Table 5.14 Summary of Manual Data Entry results

| Successful | Help required | Unsuccessful |
| :---: | :---: | :---: |
| 11 | 4 | 0 |

Suggested changes based on feedback:

* Make the input format more obvious  
* Label this function on the main screen

### Task 3: Viewing data on a dashboard

All users were able to find a block for viewing the number of steps themselves without using navigation. Many were satisfied with the design and visualization, but some suggested improvements.  
*Sample comments*:

* “Everything was obvious and easy to understand, I could figure it out on my own”  
* “All good, but I would like to see a graph, for the best comparison of results at the distance”

   
Table 5.15 Summary of Manual Data Entry results

| Successful | Help required | Unsuccessful |
| :---: | :---: | :---: |
| 15 | 0 | 0 |

 

### Suggested changes based on feedback:

* Add graphs and/or charts to compare past values with current ones

### Task 4: Logging out

All test participants were able to navigate the site themselves to log out of their account.

Sample comments: “That was easy, nothing to talk about”

Table 5.16 Summary of Manual Data Entry results

| Successful | Help required | Unsuccessful |
| :---: | :---: | :---: |
| 15 | 0 | 0 |

## Questionnaire Results {#questionnaire-results}

### Summary of responses {#summary-of-responses}

Table 5.17 Questionnaire Response Key

| 1 | 2 | 3 | 4 | 5 |
| :---: | :---: | :---: | :---: | :---: |
| Strongly disagree | Disagree | Neutral | Agree | Strongly Agree |

   
Table 5.18 Summary of Likert Scale responses

| Question | 1 | 2 | 3 | 4 | 5 |
| ----- | :---: | :---: | :---: | :---: | :---: |
| Overall, I found the application prototype easy to use | 0 | 0 | 1 | 7 | 7 |
| The layout of the main Dashboard was clean and the information was easy to understand | 0 | 0 | 1 | 3 | 11 |
| The navigation was logical, and I was able to find what I was looking for | 0 | 1 | 1 | 7 | 6 |
| The color scheme and visual design (white, dark blue, bright accent) are appealing. | 0 | 0 | 5 | 5 | 5 |
| How easy was it to find the button to manually enter your data | 0 | 1 | 2 | 8 | 4 |

###  Layout and design {#layout-and-design}

After conducting the experiment, we realized that most users appreciated the visual appearance of our site. Almost all users were able to quickly understand how they should interact with the system to accomplish the task, but some still needed help. Users were satisfied with the color palette, the layout of the blocks on the site, calling it simple and minimalist. However, some of them noted that they would like to configure themselves which specific biometric indicators they would like to see on the desktop in their application. Some users also noted that they would like to see on the main screen goals for the day and motivational cues to remind them.

### Features {#features}

The participants were satisfied with the functionality of our site. They felt that the buttons' functions are not difficult to use and most people can handle them without outside help, but some of the participants did propose to make them more obvious. It was suggested to sign or make prompts for places where you need to enter data yourself, because some users considered this function not obvious. Users also suggested we add graphs for better visualization and biometrics comparison.  
 

## Conclusion

The report is broken into five parts: Functional Requirements, Project Decisions and Planning, Costing and Usability Testing Overview. The Functional Requirements gives an overview of all the features planned. The Project Decisions describe the tools and softwares going to be used in the project. The usability testing contains the plan, surveys and the results.

## 

## 

## 

## 

## Appendix

## Appendix I {#appendix-i}

### Input Types {#input-types}

Each input type will have a time reference. The basic information that would be collected on users would consist of their name, age, height, weight and gender. The biomarker that would be collected by wearables would consist of their heart rate, calories, steps taken in a day, blood pressure and blood glucose. 

Each input type would be compared depending on how often data is collected and would be compared to when it was last recorded.

# Use Case Specifications {#use-case-specifications}

Table 6.1.1 Registration Use Case

| Use Case:  Register Account |
| :---- |
| **ID:**  UC1 |
| **Goal:** To create a new user account in the system |
| **Primary Actor:** New User |
| **Precondition:**  User is not logged into the system. User has a valid email address. |
| **Postcondition:** New user is created. User can log into the system with the new credentials. User’s role is established in the system.   |
| **Main Flow:** User intends to create an account and navigates to the Registration page. System displays registration form with fields User Type, Full Name, Email, Password, Confirm Password and consent check box. User selects account type. User enters details into the Full Name, Email, Password and Confirm Password fields. User checks the consent checkbox agreeing to share their health information. User clicks on the “Create Account” button. System validates all the input fields. System creates a new user account with a selected role. System authenticates the email. System successfully creates the account and redirects the user to the login. |
| **Alternative Flow: 4A. Email already exists** System detects email address is already registered and displays error. System prompts user to use a different email or login with the existing email address. User enters valid email address or navigates to the login page. **4B. Password does not meet requirements** System highlights password field as invalid and prompts the user to meet the requirements. User enters a valid password meeting requirement. **4C. Passwords do not match**  System displays error and prompts user to re-enter the correct password. User enters matching password. **7A. Required fields missing** System displays error and prompts user to complete all the required fields. User completes all the fields and re-submits. **7B.  Consent not given** System displays error and prompts user to agree to the terms. User checks the box and re-submits. |

Table 6.1.2 Login Use Case

| Use Case:  Login to System |
| :---- |
| **ID:**  UC2 |
| **Goal:** To access the system |
| **Primary Actor:** Registered user |
| **Precondition:**  User has a registered account in the system. User has valid login credentials. |
| **Postcondition:** User is authenticated and granted access to the system. User session is established and is redirected to the appropriate dashboard based on the role. |
| **Main Flow:** User navigates to the login page and enter credentials. User clicks on the “Sign In” button. System validates credentials against user database. System creates authenticated session and redirects user to the appropriate dashboard. System logs successful login attempt. |
| **Alternative Flow: 1A. Invalid Email/Password** System displays error and prompts user to enter valid credentials. System increments failed login attempt counter to the account. User re-enters credentials or uses “Forgot Password” option. **1B. Password does not meet requirements** System detects account is temporarily locked due to multiple failed attempts and displays error. User waits for lockout period to expire and re-tries. **1C. Passwords reset required** System redirects the user to the password reset process. User completes the process and sets the new password. System allows user to login with the new password. |

Table 6.1.3 Logout Use Case

| Use Case:  Logout from System |
| :---- |
| **ID:**  UC3 |
| **Goal:** To end the user session |
| **Primary Actor:** Authenticated User |
| **Precondition:**  User is currently logged into the system. Active user session exists. |
| **Postcondition:** User session is terminated. All session data is cleared. User is redirected to the login page. System logs the logout event. |
| **Main Flow:** User clicks on the “Logout” button from the sidebar. System asks for confirmation. User confirms logout action. System terminates the user session. System clears all session data and cookies. System redirects user to the login page. System logs the logout event with a timestamp. |
| **Alternative Flow: 3A. Automatic session timeout** System detects user inactivity exceeding the timeout period. System automatically initiates logout process. System displays timeout warning message with the option to extend the session. If no response, system automatically logs out. When user returns, system displays appropriate message. **3B. User cancels logout**   User chooses to cancel logout action. System closes the confirmation dialog and returns the user to the previous screen. |

Admin   
Table 6.1.4 Admin View System Statistics Use Case

| Use Case: Viewing System Statistics |
| :---- |
| ID: A1 |
| Goal: To view overall system user statistics. |
| Primary actor: Admin |
| Precondition:  Admin is logged into the system. System displays the user data stored. |
| Postcondition: Admin can see system overview. System displays total user counts. |
| Main Flow: Admin logs into the dashboard. Admin views “Total Users” Tab. Admin views “Total Patient” Tab. Admin views “Total Doctors” Tab. System displays all the statistics at the same time. |
| Alternative Flow: **2A. No user data exists** System detects no user records exist in the database. System displays 0 for all statistics. The use case resumes at step 5 of the main flow.  **5A. Database connection error** The system fails to connect to the database or retrieve the data. The system stops the retrieval process. System displays an error message. |

Table 6.1.5 Admin View User List Use Case

| Use Case: Viewing User List |
| :---- |
| ID: A2 |
| Goal: To view a complete list of all the registered users. |
| Primary actor: Admin |
| Secondary Actor: System |
| Precondition:  Admin is logged into the system. Registered users exist in the database. |
| Postcondition: Admin can see user details and status.  System displays a complete user list. |
| Main Flow: Admin navigates to the “User Management” section of the dashboard. System displays all user records with columns: Name, Email, Role, Status, Actions. Admin views the list of all the users. |
| Alternative Flow: **2A. No users exists in the database** The system retrieves 0 user records from the database. The system displays a message “No users found in the system. Add user” System displays an empty table. |

Table 6.1.6 Admin Deactivate User Use Case

| Use Case: Deactivate User |
| :---- |
| ID: A3 |
| Goal: To deactivate an active user account |
| Primary actor: Admin |
| Precondition:  Admin is viewing the user list.  Target user has an “Active” status. |
| Postcondition: User Account is deactivated. User status changes to “Deactivated”. |
| Main Flow: Admin identifies the target active user. Admin clicks the “Deactivate” button. System asks for confirmation. Admin confirms deactivation. System changes the user’s status to “Deactivated”  |
| Alternative Flow: **4A. Admin cancels deactivation** System closes confirmation. User status remains unchanged.   |

Table 6.1.7 Admin Activate User Use Case

| Use Case: Activate User |
| :---- |
| ID: A4 |
| Goal: To activate a deactivated user account |
| Primary actor: Admin |
| Precondition:  Admin is viewing the user list.  Target user has a “Deactivated” status. |
| Postcondition: User Account is activated. User status changes to “Active”. |
| Main flow: Admin identifies the target deactivated user. Admin clicks the “Activate” button. System asks for confirmation. Admin confirms activation. System changes the user’s status to “Active”  |
| Alternative Flow: **4A. Admin cancels activation** System closes confirmation. User status remains unchanged.  |

Doctor Use Cases  
Table 6.1.8 Doctor View Alert Summary Use Case

| Use Case: View Alert Summary |
| :---- |
| ID: D1 |
| Goal: To view patients requiring immediate attention |
| Primary Actor: Doctor |
| Precondition:  1\.      Doctor is logged into the system.  2\.      Patients have triggered health alerts. |
| Postcondition: 1\.      Doctor sees the overview of the critical patients. 2\.      Alert counts are displayed. |
| Main Flow: System displays “Alerts” section. Doctor views patient names with alert counts. System highlights patients needing urgent review. |
| Alternative Flow: **3A.  No patients require attention** The system detects that no patients currently have active health alerts. The system displays a positive status message. |

Table 6.1.9 Doctor View Patient List Use Case

| Use Case: View Patient List |
| :---- |
| ID: D2 |
| Goal: To view all assigned patients. |
| Primary Actor: Doctor |
| Precondition:  Doctor is logged into the system.  Patients are assigned to the doctor.  |
| Postcondition: Complete patient list is displayed. Doctor can select patients for detailed view. |
| Main Flow: Doctor navigates to “Patients” section. System retrieves assigned patients from the database. System displays patient cards allowing the doctor to scroll through the patient list. |
| Alternative Flow: **2A. No patients assigned.** The system retrieves zero patient records assigned to the doctor. The system displays an empty state message. |

Table 6.2.1 Doctor Query for Patients Use Case

| Use Case: To Search for Patients |
| :---- |
| ID: D3 |
| Goal: To find specific patients. |
| Primary Actor: Doctor |
| Precondition:  Doctor is viewing patient list. Search functionality is available. |
| Postcondition: Filtered patient results are displayed. Doctor finds target patient. |
| Main Flow: Doctor clicks the search field “Search by name, ID or condition”. Doctor enters his search. System displays the filtered matching results. Doctor selects the patient from the results. |
| Alternative Flow: **3A. No Patients Match Search** The system finds no patients matching the search criteria. The system displays “No patients found matching the search”. |

Table 6.2.2  Doctor View Patient Details Use Case

| Use Case: View Patient Details |
| :---- |
| ID: D4 |
| Goal: To view comprehensive patient information |
| Primary Actor: Doctor |
| Precondition:  Doctor has selected a patient. Patient data exists in a system.  |
| Postcondition: Complete patient profile is displayed. Doctor has full context of the medical conditions. |
| Main Flow: Doctor selects patient from the list. System retrieves patient details from database. System displays Patient ID, Age and Condition. System shows vital signs summary and last visit date.   |
| Alternative Flow: **2A. Patient record not found** The system cannot find the selected patient’s record in the database. The system displays an error. The system returns the Doctor to the patient list. **2B. Insufficient Access Permissions** The system checks permissions and determines the doctor cannot access the patient’s details. The system displays appropriate message. The system returns the doctor to the patient list. |

Table 6.2.3  Doctor View Vital Signs Use Case

| Use Case: View Vital Signs |
| :---- |
| ID: D5 |
| Goal: To monitor patient health biomarkers |
| Primary Actor: Doctor |
| Precondition:  Doctor is viewing patient details. Vital signs data is available.   |
| Postcondition: Current health metrics are displayed. Doctor assesses patient condition. |
| Main Flow: Doctor assesses the patient vital signs section. System displays metrics. Doctor views the readings. System shows the timestamps of the last readings.   |
| Alternative Flow: **2A. Vital Signs are missing** System displays “Data not available”. Doctor requests the patient to update metrics. |

Table 6.2.4  Doctor View Scheduled Appointments Use Case

| Use Case: View Scheduled Appointments |
| :---- |
| ID: D6 |
| Goal: To see upcoming patient appointments   |
| Primary Actor: Doctor |
| Precondition:  Doctor is logged into the system. Appointments are scheduled. |
| Postcondition: Upcoming schedule is displayed. Doctor prepares for consultations. |
| Main Flow: Doctor navigates to appointments section. System displays an appointment dashboard. Doctor sees scheduled and upcoming appointments. Doctor reviews appointment details and purposes. |
| Alternative Flow: **3A. No scheduled appointments** The system finds no upcoming appointments for the doctor. The system displays an appropriate message. **3B. Overlapping Appointments** The system retrieves appointments and detects a scheduling conflict. The system displays appropriate message. The system asks doctor to reschedule the conflicting appointments |

Table 6.2.5 Doctor Manage Follow Ups Use Case

| Use Case: Manage Follow Ups |
| :---- |
| ID: D7 |
| Goal: To schedule and track patient follow-up appointments |
| Primary Actor: Doctor |
| Precondition:  Doctor is viewing patient appointments. Follow-Up is medically necessary. |
| Postcondition: Follow Up appointments are scheduled. Patient Care continues. |
| Main Flow: Doctor identifies the need for follow up. Doctor navigates to schedule new appointment. System provides appointment scheduling interface. Doctor selects appointment type. Doctor sets time, date and purpose. System confirms appointments and notifies patients. Follow-Up appears in the scheduled appointments list.   |
| Alternative Flow: **5A. No suitable time slots available** System displays available alternative dates. Doctor selects different time with the patient. System notifies the patient. |

Table 6.2.6 Patient View Dashboard Use Case

| Use Case:  View Dashboard |
| :---- |
| ID:  P1 |
| Goal: To access the patient dashboard. |
| Primary Actor: Patient   |
| Precondition:  User is registered and logged into the system as a patient.  |
| Postcondition: Main dashboard is displayed. Patient can navigate to all major sections. |
| Main Flow: Patient logs into system. System loads the main dashboard interface. System displays the personalized greeting and health summary. Patient views the key health metrics. Patient can navigate to biometric data, appointments and medications section. |
| Alternative Flow: **1A. First Time User** The system detects the patient’s first login, so no health data exists. The dashboard highlights empty biomarkers with clear call-to-action buttons. Patient either enters the records or proceeds with the empty dashboard. |

Table 6.2.7 Patient View Biometric Data Use Case

| Use Case:  View Biometric Data |
| :---- |
| ID:  P2 |
| Goal: To monitor current health metrics and readings |
| Primary Actor: Patient |
| Precondition:  Patient is viewing the dashboard. Biometric data is available in the system. |
| Postcondition: Biometric readings are displayed. Patient can see status indicators and trend. |
| Main Flow: Patient navigates to “Vitals” section from the dashboard. System retrieves current biometric readings from the database. System displays current values with the status indicators. System shows optimal ranges for each metric. Patient reviews current health status. |
| Alternative Flow: **2A. No biometric data available** System displays appropriate message. System provides the “Add Manual Entry” button Patient can add their first data entry. |

Table 6.2.8 Patient Add Manual Data Entry Use Case

| Use Case:  Add Manual Data Entry |
| :---- |
| ID:  P3 |
| Goal: To manually input health readings |
| Primary Actor: Patient |
| Precondition:  Patient is viewing the vitals section of the dashboard. Manual Entry functionality is available. |
| Postcondition: New heath reading is recorded in the system. Data is validated and stored. |
| Main Flow: Patient clicks on the specific biomarker. System displays the data entry form. Patient enters the value within the valid range. Patient sets optional timestamp or current time. Patient clicks on the “Add Reading” button. System stores the new reading in the database. System confirms successful save and updates the display. |
| Alternative Flow: **3A. Value outside acceptable ranges** System displays the error message. System asks the user to enter the value within the highlighted range. **5A. Patient cancels data entry** System discards the entered data. System returns to the biometric data view without saving. No changes are made to the patient records.   |

Table 6.2.9 Doctor View Biometric Data Use Case

| Use Case:  View Recent Readings |
| :---- |
| ID:  P4 |
| Goal: To access recent metrics |
| Primary Actor: Patient |
| Precondition:  Patient is viewing the health metrics. Recent Data exists in the system. |
| Postcondition: Historical readings timeline is displayed Patient can analyse trends over time. |
| Main Flow:  Patient clicks on the specific health metric. System retrieves historical biometric data from the database. System displays chronological list of readings with timestamps. System shows the trend graphs and charts. Patient tracks historical patterns and progress. Patient can filter by time ranges. |
| Alternative Flow: **2A. No Historical Data available** System displays appropriate message. System encourages patient to add to their readings. |

Table 6.3.1 Patient View Appointments Use Case

| Use Case:  View Appointments |
| :---- |
| ID:  P5 |
| Goal: To monitor upcoming medical appointments  |
| Primary Actor: Patient |
| Precondition:  Patient is viewing the dashboard. Appointment data is available in the system. |
| Postcondition: Upcoming appointments are displayed. Patient is prepared for scheduled consultations.  |
| Main Flow: Patient navigates to the “Appointment” section from the dashboard. System retrieves scheduled appointments from the database. System displays upcoming appointments with dates, times and details of the doctor. Patient reviews appointment schedules. System shows the Appointment type and purpose. |
| Alternative Flow: **2A. No upcoming appointments scheduled** System displays appropriate message. System provides the patient the option to “Request Appointment” if needed. Patient requests the healthcare provider to schedule a new appointment. **4A. Reschedule/Cancel Appointment** System provides “Reschedule” or “Cancel” options for each appointment. System guides the patient through the rescheduling or cancelling process. System updates appointment status and notifies the provider. |

Table 6.3.2 Patient View Medication Use Case

| Use Case:  View Medication |
| :---- |
| ID:  P6 |
| Goal: To access prescribed medications |
| Primary Actor: Patient |
| Precondition:  Patient is viewing the dashboard. Medication data exists in the system. |
| Postcondition: Complete medication list is displayed. Patient can review dosage and schedule information.   |
| Main Flow: Patient navigates to “Medications” section of the dashboard. System retrieves current medication list. System displays medication names, dosages, schedules and instructions. Patient reviews medication routine. |
| Alternative Flow: **2A. No medication recorded in the system** System displays appropriate message. System provides an option to add medication if needed. |