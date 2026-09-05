# AI Usage Declaration

This document declares the use of AI assistance (Claude, by Anthropic) in the development of *Plus Two*, in accordance with the course's AI Usage Quantification Guidelines.

## Summary

The Plus Two project was primarily designed, developed, tested, and implemented by the student. The student was responsible for the overall concept, architecture, feature decisions, database design, application logic, frontend structure, and testing.

Claude was used primarily as a debugging and development-support tool. It was also occasionally used to assist with implementation of specific code components and to suggest solutions to technical problems. The student reviewed, adapted, tested, and integrated all AI-assisted code and remains responsible for the final implementation.

## Student-Driven Work and Decisions

The following aspects of the project were determined and driven by the student:

* The core product concept: a couple-to-couple social discovery platform, distinct from the Organizer/Listing/Booking system required by the assignment.

* The decision that a Couple represents one authenticated account, with the partner represented as profile data rather than as a separate login.

* The overall RBAC structure consisting of Couple, Organizer, and Admin roles.

* The decision to consolidate the initially considered separate Event and Activity organizer roles into a single Organizer role with a category field.

* The design of Couple profiles, including the distinction between mandatory and optional profile information.

* The decision to restrict optional profile information and contact details such as email and phone number until a connection request has been accepted.

* Identification of product and functionality gaps during development, including the missing couple-discovery functionality and the missing primary-user name field.

* Identification of the missing Report-filing interface, where the backend functionality existed but was not yet exposed through the frontend.

* The application name, *Plus Two*, and the decision to redesign the visual appearance after evaluating the initial interface and determining that it appeared too generic.

* The overall testing and validation of the application. The student manually tested the application across all three user roles using both the browser and API requests.

* Identification of several issues during testing, including a foreign-key constraint error when deleting records, a stale file preventing functionality from working correctly, and sensitive information being unnecessarily exposed through an API response.

## Areas Where AI Was Used

Claude was primarily used to support debugging and resolve technical issues encountered during development. Examples include:

* Debugging TypeScript and TypeORM configuration issues.

* Investigating and resolving a foreign-key constraint error.

* Troubleshooting database migration problems caused by adding non-nullable columns to existing tables.

* Helping identify potential causes of unexpected application behaviour during testing.

* Providing suggestions for implementation approaches when the student encountered technical difficulties.

Claude was also used to assist with portions of the implementation, including:

* TypeORM entity definitions.

* Express route handlers and middleware.

* React components and frontend functionality.

* CSS and visual styling.

These AI-assisted portions were reviewed and tested by the student before being incorporated into the final project. The student made the final decisions regarding their use, structure, and modification.

## Student Responsibility

The student was responsible for the final application and its functionality. AI-generated suggestions or code were not accepted without review. The student tested the implemented functionality, identified errors independently during testing, and made the necessary corrections and adjustments.

The use of AI therefore primarily served as a development aid, particularly for debugging, troubleshooting, and resolving implementation issues, rather than as a substitute for the student's design, decision-making, testing, or overall development work.

## Tools Used

* Claude (Anthropic), via claude.ai
