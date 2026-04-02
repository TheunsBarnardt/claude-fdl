---
title: "Data"
layout: default
parent: Blueprint Catalog
has_children: true
nav_order: 3
description: "CRUD, storage, versioning, and data management blueprints."
---

# Data Blueprints

CRUD, storage, versioning, and data management blueprints.

| Blueprint | Description | Version |
|-----------|-------------|----------|
| [Bank Reconciliation]({{ site.baseurl }}/blueprints/data/bank-reconciliation/) | Bank reconciliation with statement import, auto/manual matching, reconciliation models, partial/full tracking, and write-off management.  | 1.0.0 |
| [Content Tree]({{ site.baseurl }}/blueprints/data/content-tree/) | Hierarchical content tree with zone-based storage, tree walking, flattening, indexed lookups, and schema migration | 1.0.0 |
| [Document Management]({{ site.baseurl }}/blueprints/data/document-management/) | Store, retrieve, manage, and generate documents with metadata, permissions, version control, and dynamic PDF generation | 1.0.0 |
| [Editor State]({{ site.baseurl }}/blueprints/data/editor-state/) | Centralized state management with sliced architecture, action dispatching, computed selections, and public API | 1.0.0 |
| [Expense Approval]({{ site.baseurl }}/blueprints/data/expense-approval/) | Submit and approve employee expense reports with receipt validation | 1.0.0 |
| [Field Transforms]({{ site.baseurl }}/blueprints/data/field-transforms/) | Per-field-type transformation pipeline with read-only path resolution, async tracking, and trigger-based caching | 1.0.0 |
| [Payload Collections]({{ site.baseurl }}/blueprints/data/payload-collections/) | Full CRUD operations for document collections with pagination, filtering, hooks, bulk operations, and field selection | 1.0.0 |
| [Payload Document Locking]({{ site.baseurl }}/blueprints/data/payload-document-locking/) | Automatic document locking to prevent concurrent editing with configurable lock duration and override capability | 1.0.0 |
| [Payload Globals]({{ site.baseurl }}/blueprints/data/payload-globals/) | Singleton document management for site-wide settings, navigation, headers, and footers with versioning and access control | 1.0.0 |
| [Payload Preferences]({{ site.baseurl }}/blueprints/data/payload-preferences/) | Per-user preferences storage for admin UI state including collapsed fields, tab positions, column visibility, sort order, and list view settings | 1.0.0 |
| [Payload Uploads]({{ site.baseurl }}/blueprints/data/payload-uploads/) | File upload system with image resizing, focal-point cropping, MIME validation, cloud storage adapters, and range request support | 1.0.0 |
| [Payload Versions]({{ site.baseurl }}/blueprints/data/payload-versions/) | Document versioning with draft/publish workflow, autosave, version history, restore, scheduled publishing, and locale-specific status | 1.0.0 |
| [Portfolio Management]({{ site.baseurl }}/blueprints/data/portfolio-management/) | Retrieve, manage, and report on investment portfolio holdings, positions, valuations, and transaction history | 1.0.0 |
| [Prisma Crud]({{ site.baseurl }}/blueprints/data/prisma-crud/) | Execute type-safe database CRUD operations with Prisma Client query builder | 1.0.0 |
| [Prisma Migrations]({{ site.baseurl }}/blueprints/data/prisma-migrations/) | Manage database schema versioning and evolution with safe migrations | 1.0.0 |
| [Prisma Schema]({{ site.baseurl }}/blueprints/data/prisma-schema/) | Define application data models with fields, types, relationships, and validation rules in Prisma schema | 1.0.0 |
| [Product Configurator]({{ site.baseurl }}/blueprints/data/product-configurator/) | Product configuration with attributes, variant generation, exclusion rules, dynamic pricing, visual pickers, custom inputs, and matrix bulk ordering.  | 1.0.0 |
| [Proposals Quotations]({{ site.baseurl }}/blueprints/data/proposals-quotations/) | Creation, management, and approval workflow for investment proposals and quotations delivered to clients | 1.0.0 |
| [Tax Engine]({{ site.baseurl }}/blueprints/data/tax-engine/) | Tax engine with percentage, fixed, division, group, and formula-based tax types, repartition, cash-basis accounting, and fiscal position mapping.  | 1.0.0 |
| [Undo Redo]({{ site.baseurl }}/blueprints/data/undo-redo/) | Linear history stack with debounced recording, forward-branch destruction, and keyboard shortcut navigation | 1.0.0 |
