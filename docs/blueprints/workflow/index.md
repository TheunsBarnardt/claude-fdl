---
title: "Workflow"
layout: default
parent: Blueprint Catalog
has_children: true
nav_order: 7
description: "Business process, job queue, automation, and pipeline blueprints."
---

# Workflow Blueprints

Business process, job queue, automation, and pipeline blueprints.

| Blueprint | Description | Version |
|-----------|-------------|----------|
| [Advisor Onboarding]({{ site.baseurl }}/blueprints/workflow/advisor-onboarding/) | Registration and onboarding process for independent financial advisors with CID approval and mandate signing | 1.0.0 |
| [Approval Chain]({{ site.baseurl }}/blueprints/workflow/approval-chain/) | Multi-level approval workflow with sequential/parallel approvers, delegation, auto-approve rules, timeout escalation, and audit history.  | 1.0.0 |
| [Automation Rules]({{ site.baseurl }}/blueprints/workflow/automation-rules/) | Event-driven automation engine that triggers actions based on record lifecycle events, field changes, time-based schedules, incoming messages, and external webhooks with condition filtering.  | 1.0.0 |
| [Bulk Operations]({{ site.baseurl }}/blueprints/workflow/bulk-operations/) | Batch update, delete, and export operations for large record sets with progress tracking, atomic or best-effort execution, and error logging.  | 1.0.0 |
| [Client Onboarding]({{ site.baseurl }}/blueprints/workflow/client-onboarding/) | Multi-step process for new clients to complete personal, contact, address, and employment details before account opening | 1.0.0 |
| [Expense Approval]({{ site.baseurl }}/blueprints/workflow/expense-approval/) | Employee expense submission and approval workflow with multi-level authorization, reimbursement tracking, accounting journal entry generation, and payment processing.  | 1.0.0 |
| [Lua Scripting]({{ site.baseurl }}/blueprints/workflow/lua-scripting/) | Server-side Lua script execution providing atomic operations, programmatic logic, and access to all Redis commands within a single round-trip | 1.0.0 |
| [Multi Exec Transactions]({{ site.baseurl }}/blueprints/workflow/multi-exec-transactions/) | Atomic multi-command execution with optional optimistic locking via WATCH; commands queued and executed sequentially without interruption | 1.0.0 |
| [Payload Job Queue]({{ site.baseurl }}/blueprints/workflow/payload-job-queue/) | Built-in job queue with tasks, workflows, cron scheduling, retry with backoff, concurrency control, and sub-task orchestration | 1.0.0 |
| [Purchase Agreements]({{ site.baseurl }}/blueprints/workflow/purchase-agreements/) | Purchase agreement management supporting blanket orders and calls for tender with vendor selection, purchase order generation, and supplier catalog synchronization.  | 1.0.0 |
| [Purchase Order Lifecycle]({{ site.baseurl }}/blueprints/workflow/purchase-order-lifecycle/) | Purchase order lifecycle from draft through receipt and billing to completion, with supplier validation, material request tracking, warehouse bin updates, and over-receipt tolerance enforcement.  | 1.0.0 |
| [Quotation Order Management]({{ site.baseurl }}/blueprints/workflow/quotation-order-management/) | Sales quotation-to-order lifecycle including quote creation, PDF generation, portal sharing, digital signature, prepayment, order confirmation, and invoicing.  | 1.0.0 |
| [Report Generation]({{ site.baseurl }}/blueprints/workflow/report-generation/) | Scheduled and on-demand report generation with PDF, Excel, and CSV output, background processing, caching, email delivery, and cron scheduling.  | 1.0.0 |
| [Sales Order Lifecycle]({{ site.baseurl }}/blueprints/workflow/sales-order-lifecycle/) | Sales order lifecycle from draft through delivery and billing to completion, with credit limits, blanket orders, stock reservation, and auto-status.  | 1.0.0 |
| [Scheduling Calendar]({{ site.baseurl }}/blueprints/workflow/scheduling-calendar/) | Calendar event management with bookings, availability tracking, recurring events (RRULE), conflict detection, timezone-aware storage, and configurable time slot granularity.  | 1.0.0 |
| [State Machine]({{ site.baseurl }}/blueprints/workflow/state-machine/) | Generic state machine engine with named states, guarded transitions, entry/exit actions, history tracking, and lifecycle validation rules.  | 1.0.0 |
| [Support Tickets Sla]({{ site.baseurl }}/blueprints/workflow/support-tickets-sla/) | Support ticket management with SLA tracking, priority-based response/resolution deadlines, working hours calculation with holiday exclusions, and warranty claim handling.  | 1.0.0 |
| [Task Management]({{ site.baseurl }}/blueprints/workflow/task-management/) | Task lifecycle management with kanban board, subtask hierarchies, dependency tracking, priority-based scheduling, and workload balancing across assignees.  | 1.0.0 |
