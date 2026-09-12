# RFQ Marketplace Workflow

## Product Purpose

This application connects buyers who publish requirements with suppliers who submit quotations.

- A buyer publishes an RFQ requirement.
- Suppliers browse available RFQs.
- Suppliers submit one quotation for each RFQ.
- The buyer reviews all quotations linked to that RFQ.
- The buyer accepts one quotation or closes the RFQ without accepting one.

The RFQ and each quotation have their own status. Suppliers create quotations, but
only the buyer can decide what happens to those quotations. A supplier cannot
accept, reject, close, or otherwise change the status of a quotation.
## User Roles

### Buyer

A buyer can:

1. Create an RFQ.
2. Enter the product or service name.
3. Enter the requirement description.
4. Enter the quantity.
5. Enter the delivery location.
6. Set a future deadline.
7. View all of their submitted RFQs.
8. Edit an RFQ while it is open.
9. Close an open RFQ.
10. View every quotation linked to one of their RFQs.
11. Accept one quotation for an open RFQ.
12. Reject or close quotations that are not selected.
13. Close the RFQ even when one or more suppliers have already submitted quotations.

### Supplier

A supplier can:

1. Browse open RFQs published by buyers.
2. Search RFQs by product name only.
3. Open and view complete RFQ details.
4. Submit one quotation for an RFQ.
5. View only their own submitted quotations.
6. Edit their own quotation while the linked RFQ is open.
7. View the quotation submission date and linked RFQ status.

## RFQ Status

RFQs have exactly three lifecycle states:

| Status | Meaning |
| --- | --- |
| `open` | Default state. Suppliers can submit or edit quotations. The buyer can edit the RFQ, close it, or accept a quotation. |
| `closed` | The buyer closed the RFQ without accepting a quotation. No new quotations or edits are allowed. |
| `accepted` | The buyer accepted one quotation. No new quotations or edits are allowed. |

### State Transitions

```text
Create RFQ
    |
    v
  open --------------------> closed
    |
    +-----------------------> accepted
```

Only the buyer who owns the RFQ can move an RFQ from `open` to `closed` or `accepted`.

An RFQ must never return from `closed` or `accepted` to `open`.

Closing an RFQ is allowed even when quotations are linked to it. Closing the RFQ
stops further quotation activity and makes the RFQ and its quotations read-only.

## Quotation Status

Quotations have their own three states:

| Status | Meaning |
| --- | --- |
| `open` | Default state when a supplier submits a quotation. The buyer can review it. |
| `accepted` | The buyer selected this quotation. Only one quotation for an RFQ can be accepted. |
| `closed` | The buyer rejected or closed this quotation. The supplier cannot change it. |

### Quotation State Transitions

```text
Supplier submits quotation
            |
            v
          open ---------> accepted
            |
            +------------> closed
```

Only the buyer who owns the linked RFQ can change a quotation from `open` to
`accepted` or `closed`. The supplier can edit quotation details only while both
the quotation and its linked RFQ are `open`.

When the buyer accepts one quotation, the RFQ becomes `accepted` and all other
open quotations linked to that RFQ are closed or rejected. When the buyer closes
the RFQ without accepting a quotation, all open quotations linked to it are
closed or rejected.

## Quotation Rules

A quotation contains:

- Quoted price
- Estimated delivery time
- Message or notes
- System-created submission date

The database enforces one quotation per supplier per RFQ:

```sql
unique (rfq_id, supplier_id)
```

This means:

- Supplier A can submit only one quotation for RFQ 1.
- Supplier A can submit quotations for multiple different RFQs.
- Supplier B can also submit one quotation for RFQ 1.
- A duplicate quotation is rejected by the API.
- The supplier can edit their existing quotation instead of submitting another one.

Quotation visibility is always scoped:

- Buyers see all quotations for their own RFQ.
- Suppliers see only quotations submitted by themselves.
- A supplier cannot view another supplier's quotation through the supplier dashboard.
- A buyer can see each quotation's supplier, price, delivery time, message, date,
  and quotation status.

## Buyer Workflow

1. Open the buyer dashboard.
2. Select `Create RFQ`.
3. Complete the RFQ form in a popup.
4. Submit the RFQ.
5. The RFQ is saved with status `open`.
6. Select an RFQ from `My RFQs`.
7. Review all quotations in the RFQ details view.
8. For each open quotation, choose one of the available actions:
  - `Accept quotation`: changes that quotation to `accepted` and changes the RFQ to `accepted`.
  - `Reject quotation`: changes that quotation to `closed` while the RFQ remains open.
9. Choose `Close RFQ` when the buyer wants to stop the RFQ. This changes the RFQ
  to `closed`, even if suppliers have submitted quotations, and closes any
  remaining open quotations.
10. After the RFQ is closed or accepted, the RFQ and all linked quotations become read-only.

The buyer can edit RFQ fields only while the RFQ status is `open`.

## Supplier Workflow

1. Open the supplier dashboard.
2. Browse the list of open RFQs.
3. Search using the debounced search field.
4. Select an RFQ to view its complete details.
5. If no quotation exists for that supplier and RFQ, choose `Submit quotation`.
6. Complete the quotation form in a popup.
7. Submit the quotation.
8. The supplier then sees `You already submitted one quotation` for that RFQ.
9. The quotation remains `open` until the buyer accepts or rejects it.
10. The supplier can choose `Edit your quotation` while the quotation and RFQ are open.
11. Once the buyer accepts, rejects, or closes the RFQ, the supplier can view the
  quotation but cannot edit its details or status.

## API Contract

### RFQs

| Method | Route | Role | Behavior |
| --- | --- | --- | --- |
| `POST` | `/api/rfqs` | Buyer | Create an open RFQ |
| `GET` | `/api/rfqs/mine` | Buyer | List the buyer's RFQs |
| `PATCH` | `/api/rfqs/:id` | Buyer | Edit an owned open RFQ |
| `POST` | `/api/rfqs/:id/close` | Buyer | Close an owned open RFQ |
| `POST` | `/api/rfqs/:id/accept` | Buyer | Accept a quotation linked to an owned open RFQ |
| `GET` | `/api/rfqs` | Supplier | Browse and search open RFQs |
| `GET` | `/api/rfqs/:id` | Buyer/Supplier | View RFQ details |

### Quotations

| Method | Route | Role | Behavior |
| --- | --- | --- | --- |
| `POST` | `/api/quotations/rfq/:rfqId` | Supplier | Submit the supplier's one quotation for an open RFQ |
| `PATCH` | `/api/quotations/:id` | Supplier | Edit the supplier's own quotation while the RFQ is open |
| `GET` | `/api/quotations/mine` | Supplier | List only the supplier's quotations |
| `GET` | `/api/quotations/rfq/:rfqId` | Buyer | List all quotations for the buyer's RFQ |
| `POST` | `/api/quotations/:id/accept` | Buyer | Accept an open quotation for the buyer's RFQ |
| `POST` | `/api/quotations/:id/close` | Buyer | Reject or close an open quotation |

## Frontend Structure

The frontend keeps workflow responsibilities separated:

- `App.js`: session state, API calls, and workflow coordination.
- `AuthPanel.js`: login and signup.
- `BuyerDashboard.js`: buyer RFQ workspace and RFQ popup.
- `SupplierDashboard.js`: supplier RFQ search and supplier quotation list.
- `RfqDetails.js`: full RFQ details and quotation popup.
- `RfqForm.js`: create/edit RFQ form.
- `QuoteForm.js`: submit/edit quotation form.
- `RfqList.js`: RFQ list and buyer actions.
- `QuoteList.js`: quotation list, dates, and accept/edit actions.
- `api.js`: Axios client and authentication header.

## UI Rules

- RFQ creation and editing use a popup.
- Quotation submission and editing use a popup.
- The RFQ detail view remains focused on requirement information and linked quotations.
- Status must be visible on every RFQ.
- Quotation status must be visible on every quotation.
- Quotation submission date must be visible on every quotation.
- Supplier search is debounced and searches product name only.
- Actions unavailable for the current status must not be shown.
- Supplier quotation forms must not allow a second quotation for the same RFQ.
- Buyer accept/reject/close actions must be clearly separated from supplier actions.
- Backend authorization remains the source of truth even when the frontend hides unavailable actions.
