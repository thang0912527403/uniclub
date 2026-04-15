"""Update System Test.xlsx Club Fund sheet: English prose, Vietnamese UI labels in quotes."""
from __future__ import annotations

from copy import copy
import shutil
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "System Test.xlsx"
BACKUP = ROOT / "System Test.xlsx.bak"

# Row 2 col B — test requirement (English; Vietnamese only for quoted UI where noted)
B2_TEXT = (
    "System test (end user): a member or manager logs into the club website and performs real actions in the UI — "
    "create a fund, contribute via PayOS QR, record cash (if available), view transactions and reports, approve or reject pending funds, "
    "submit and track refund requests, cancel refunds, and process refunds as a manager. "
    "In procedure and expected columns, name menus and buttons using the exact Vietnamese label in double quotes (e.g. \"Tạo quỹ\"). "
    "Describe expected outcomes using user-visible copy (toasts, dialogs), not raw API messages or URL paths. "
    "Use technical tools (devtools, Postman, etc.) only when the UI cannot cover an edge case.\n"
    "QA / product notes: ordinary members usually see only approved funds on the overview, except top finance roles or Admin. "
    "Create-fund has no opening-balance field; balance starts at 0. Online contributions and cash recording enforce a minimum of 10,000 ₫ per transaction. "
    "Rejecting a fund requires a reason of 5–2000 characters; if a fund no longer exists, the UI shows a clear message (e.g. \"Quỹ không tồn tại.\"). "
    "Refunds: members request refunds only for their own contributions; managers complete, cancel, or reject per product rules; rejecting a refund request requires a reason of 5–2000 characters."
)

# test_case_id -> (description, procedure, expected, preconditions) — all English except quoted UI strings
ROWS: dict[str, tuple[str, str, str, str]] = {
    "CF_3003_1.01": (
        "Fund created successfully when user is top-level Manager status APPROVED",
        (
            "1. Open the club website and log in as the club’s top manager (level 1) who may manage finance.\n"
            "2. In the sidebar, open \"Quản lý Quỹ\" → \"Tổng quan Ngân sách\".\n"
            "3. Select the club if prompted, then click \"Tạo quỹ\".\n"
            "4. Enter a valid fund name; optionally enter description and contribution deadline if the form shows those fields. "
            "Confirm there is no opening-balance field.\n"
            "5. Click \"Tạo quỹ\" and observe the notification and fund list."
        ),
        (
            "A clear success notification appears (e.g. toast title \"Đã tạo quỹ\" with the success body shown on screen).\n"
            "The new fund shows status \"Đã duyệt\" (no extra pending step for this role).\n"
            "The new fund appears on the list or on the fund detail view."
        ),
        (
            "You are an active club member with top manager (level 1) role.\n"
            "The club exists and your account may create club funds per product permissions."
        ),
    ),
    "CF_3003_1.02": (
        "Fund created successfully when user is Vice Manager (status = PENDING)",
        (
            "1. Log in as Vice Manager level 2.\n"
            "2. Open \"Quản lý Quỹ\" → \"Tổng quan Ngân sách\", then click \"Tạo quỹ\".\n"
            "3. Fill valid data and submit the form."
        ),
        (
            "Fund is created successfully.\n"
            "Fund status shows \"Chờ duyệt\".\n"
            "A success message explains the fund awaits club manager approval (wording as shown in the UI)."
        ),
        (
            "You are an active member with Vice Manager role (level 2).\n"
            "Your account may create club funds together with the vice-manager role."
        ),
    ),
    "CF_3003_1.03": (
        "Cannot create fund when fund name is empty/whitespace",
        (
            "1. Log in as a user who may create funds.\n"
            "2. Open the create flow via \"Tạo quỹ\".\n"
            "3. Leave the fund name empty or enter only spaces.\n"
            "4. Click \"Tạo quỹ\"."
        ),
        "The form blocks submit or shows a clear validation error; no fund is created.",
        "Your account has permission to open the create-fund screen.",
    ),
    "CF_3003_1.04": (
        "Cannot create fund when fund name duplicates an existing non-rejected fund in the same club",
        (
            "1. Log in as a user who may create funds (manager or vice with the right permission).\n"
            "2. Open \"Tạo quỹ\".\n"
            "3. Enter a name already used by another fund in the same club that is still pending or approved.\n"
            "4. Click \"Tạo quỹ\"."
        ),
        (
            "The site shows a clear duplicate-name error (e.g. toast \"Tên quỹ bị trùng\" with guidance to pick another name).\n"
            "No second fund with that name is created."
        ),
        "Another fund in the club already uses the same name (pending or approved, not rejected).",
    ),
    "CF_3003_1.05": (
        "Cannot create fund when contribution deadline is in the past (if expiry is used)",
        (
            "1. Log in as a user who may create funds.\n"
            "2. Open \"Tạo quỹ\".\n"
            "3. If a deadline field is shown, pick a calendar date before today.\n"
            "4. Click \"Tạo quỹ\"."
        ),
        "A validation message explains the date is not allowed; the fund is not created.",
        "You have permission to create a fund.",
    ),
    "CF_3003_1.06": (
        "Cannot create fund when user is a regular member (not management)",
        (
            "1. Log in as an ordinary active member (not club manager or vice).\n"
            "2. Browse the sidebar and finance-related areas — there is no normal path to create a club fund for this role.\n"
            "3. (Optional QA) If an old bookmark exists, open it and observe: access denied or no fund created."
        ),
        "There is no standard way to create a fund, or access is denied; no fund is created.",
        "You are active in the club but your role is not allowed to create funds.",
    ),
    "CF_3003_2.01": (
        "Contribution succeeds and PayOS link is returned for a valid amount",
        (
            "1. Log in as a club member.\n"
            "2. Open an APPROVED fund’s detail page (from \"Tổng quan Ngân sách\" or \"Quỹ của tôi\", then open the fund).\n"
            "3. Click \"Nộp tiền\", enter an amount at least the minimum (10,000 ₫).\n"
            "4. Click \"Tạo thanh toán\" and follow the PayOS step (QR and/or payment link).\n"
            "5. After successful payment, verify fund balance and history update per product behavior (including any confirmation toast)."
        ),
        (
            "A contribution/payment step appears in a waiting-for-payment state as designed.\n"
            "The screen shows PayOS QR or link, amount, and payment expiry where applicable.\n"
            "After payment completes, the fund balance reflects the contribution when the confirmation flow finishes."
        ),
        (
            "The fund exists, is approved, and is not past its contribution deadline if one was set.\n"
            "You are an active club member. Club PayOS is configured (production or sandbox).\n"
            "The amount is at least 10,000 ₫."
        ),
    ),
    "CF_3003_2.02": (
        "Cannot create contribution when Amount = 0",
        (
            "1. Log in and open an approved fund you may contribute to.\n"
            "2. Click \"Nộp tiền\", enter amount zero.\n"
            "3. Try \"Tạo thanh toán\"."
        ),
        "The site shows a validation error; no valid PayOS payment request is created.",
        "An approved fund exists and you may open the contribute flow.",
    ),
    "CF_3003_2.03": (
        "Cannot create contribution when Amount < minimum",
        (
            "1. Log in.\n"
            "2. Open \"Nộp tiền\", enter an amount below the minimum (under 10,000 ₫).\n"
            "3. Click \"Tạo thanh toán\"."
        ),
        (
            "A validation message appears (e.g. toast \"Số tiền không hợp lệ\" stating the minimum amount in ₫).\n"
            "No contribution is created."
        ),
        "The fund exists and allows contribution; minimum online contribution is 10,000 ₫.",
    ),
    "CF_3003_2.04": (
        "Cannot create contribution when fund is not approved (PENDING)",
        (
            "1. Log in as a member.\n"
            "2. Try to reach the contribute action for a fund still \"Chờ duyệt\" (e.g. from a saved link or any UI path that exposes it)."
        ),
        "Contribute is not offered, or the action fails with a clear message; no successful contribution.",
        "A fund in pending state exists in the club.",
    ),
    "CF_3003_2.05": (
        "Cannot create contribution when fund has expired (if expiry applies)",
        (
            "1. Log in as a member.\n"
            "2. Open a fund whose contribution deadline has passed.\n"
            "3. Check whether \"Nộp tiền\" is still available."
        ),
        "Contribute is hidden or disabled, or submit fails with a message that the deadline has passed.",
        "A fund exists with a contribution deadline in the past.",
    ),
    "CF_3003_3.01": (
        "View contribution payment / transactions",
        (
            "1. Log in.\n"
            "2. In the sidebar, open \"Quản lý Quỹ\" → \"Giao dịch\".\n"
            "3. On the table, verify each row is readable: cash rows from the manager flow are identifiable by the source/type labels shown in the UI; "
            "after a refund is fully processed, related expense lines can be traced to the original contribution where the UI exposes that link."
        ),
        "The transaction or history screen is readable and supports the verification above.",
        "User is logged in.",
    ),
    "CF_3003_3.02": (
        "View report",
        (
            "1. Log in with an account that may view club finance reports.\n"
            "2. From \"Quản lý Quỹ\", open the fund report / summary screen (the menu entry used in the product for fund analytics).\n"
            "3. Read the counts and totals shown."
        ),
        (
            "The report shows understandable totals for pending, approved, and rejected funds and the overall contribution picture the product is designed to display."
        ),
        "You are logged in and have access to the report area for the club.",
    ),
    "CF_3003_4.01": (
        "Top manager successfully approves a PENDING fund",
        (
            "1. Log in as the club’s top manager (or system admin) who may edit finance.\n"
            "2. Open \"Quản lý Quỹ\" → \"Tổng quan Ngân sách\"; if a status filter exists, choose \"Chờ duyệt\" to find pending funds.\n"
            "3. On the fund card or detail page, click \"Duyệt quỹ\" and confirm (no rejection reason required).\n"
            "4. Verify fund status on the detail page."
        ),
        (
            "Fund status becomes \"Đã duyệt\".\n"
            "A success notification appears (e.g. \"Đã duyệt quỹ\" with the fund name in the message body)."
        ),
        "A pending fund exists. You are top manager with finance edit permission or system admin.",
    ),
    "CF_3003_4.02": (
        "Top manager successfully rejects a PENDING fund",
        (
            "1. Log in as the club’s top manager who may edit finance.\n"
            "2. Open the fund list, find a fund in \"Chờ duyệt\".\n"
            "3. Click \"Từ chối quỹ\", enter a rejection reason (at least 5 non-space characters, within the long-text limit).\n"
            "4. Click \"Xác nhận từ chối\" and read the on-screen message."
        ),
        (
            "The fund moves to rejected state.\n"
            "The rejection reason and timestamps are visible on the fund detail for rejected funds."
        ),
        "A pending fund exists in the club. You are the top manager with finance edit permission.",
    ),
    "CF_3003_4.03": (
        "Cannot approve when user is not top manager",
        (
            "1. Log in as vice manager or ordinary member (not the club’s top approver).\n"
            "2. Open \"Tổng quan Ngân sách\" — pending funds and \"Duyệt quỹ\" / \"Từ chối quỹ\" are not available as for the top manager.\n"
            "3. (Optional) If an old bookmark opens an approval UI, try to confirm — the fund status must not change inappropriately."
        ),
        "Pending funds are not listed for this user, or approve/reject controls are not available.\n"
        "If an action is forced, the fund status does not change.",
        "A pending fund exists in the club, but the logged-in user is not the top approver.",
    ),
    "CF_3003_4.04": (
        "Cannot approve or reject when the fund no longer exists (negative / edge case)",
        (
            "1. Log in as the club’s top manager who may approve funds.\n"
            "2. From a stale tab or edge path, try approve/reject when the target fund no longer exists.\n"
            "3. Observe the user-visible error feedback."
        ),
        (
            "No fund data is incorrectly changed.\n"
            "The user sees a clear error such as \"Quỹ không tồn tại.\" (or equivalent UI copy)."
        ),
        "You have manager approval rights, but the fund used in the action no longer exists.",
    ),
    "CF_3003_4.05": (
        "Cannot reject fund when rejectReason is missing, null, or whitespace-only",
        (
            "1. While logged in as the top manager, open \"Từ chối quỹ\" for a pending fund.\n"
            "2. Leave \"Lý do từ chối\" empty or enter only spaces.\n"
            "3. Click \"Xác nhận từ chối\"."
        ),
        (
            "The action is blocked with a clear validation toast: title \"Thiếu lý do\", message \"Vui lòng nhập lý do từ chối ít nhất 5 ký tự.\"\n"
            "The fund stays \"Chờ duyệt\"."
        ),
        "Same situation as CF_3003_4.02 (pending fund, top manager with edit finance).",
    ),
    "CF_3003_4.06": (
        "Cannot reject fund when rejectReason has fewer than 5 characters after trim",
        (
            "1. Same login and screen as CF_3003_4.05.\n"
            "2. Enter a rejection reason shorter than five characters after trim (e.g. abc).\n"
            "3. Click \"Xác nhận từ chối\"."
        ),
        (
            "Validation error; the fund stays pending.\n"
            "User-visible copy matches the client validation (same toast pattern as CF_3003_4.05: \"Thiếu lý do\" / \"Vui lòng nhập lý do từ chối ít nhất 5 ký tự.\")."
        ),
        "Same as CF_3003_4.05.",
    ),
    "CF_3003_4.07": (
        "Cannot reject fund when rejectReason exceeds 2000 characters after trim",
        (
            "1. Same login and screen as CF_3003_4.05.\n"
            "2. Paste a rejection reason longer than 2000 characters after trim.\n"
            "3. Click \"Xác nhận từ chối\"."
        ),
        "Validation error; the fund stays pending (submit does not succeed).",
        "Same as CF_3003_4.05.",
    ),
    "CF_3003_5.01": (
        "View fund details: existing fundId -> correct display",
        (
            "1. Log in as a club member.\n"
            "2. From the fund list, open a specific fund (fund detail page).\n"
            "3. Verify name, balances, status, and deadline if applicable."
        ),
        (
            "The fund detail page shows the expected fields.\n"
            "If the fund was rejected, the rejection reason and related timestamps are shown clearly."
        ),
        "User has permission to view the fund.",
    ),
    "CF_3003_5.02": (
        "History paging: valid page/pageSize -> correct number of items returned",
        (
            "1. Log in and open fund history on the fund detail page, or any transaction list that supports paging.\n"
            "2. Go to the first page and choose a small page size (e.g. 10 per page) if the UI allows.\n"
            "3. Use \"Sau\" / \"Trước\" when more than one page of data exists."
        ),
        (
            "Each page shows at most the chosen page size.\n"
            "Page indicators and totals match the data (no duplicated rows across pages)."
        ),
        "The fund or club has enough history rows to span more than one page.",
    ),
    "CF_3003_6.01": (
        "Top manager (or admin) records a member’s cash contribution on the website",
        (
            "1. Log in as club top manager with finance edit (or system admin).\n"
            "2. On an approved fund’s detail page, click \"Ghi nhận tiền mặt\".\n"
            "3. Select the contributing member, enter amount ≥ 10,000 ₫ and a note meeting the form’s minimum length.\n"
            "4. Submit and verify balance and history on the same page."
        ),
        (
            "Success notification \"Đã ghi nhận tiền mặt\" with updated balance in the message.\n"
            "Fund balance increases immediately; a matching income line appears in history."
        ),
        (
            "The fund is approved and still accepts contributions (not past deadline).\n"
            "The contributor is an active member of the same club.\n"
            "You are top manager level 1 with finance edit, or system admin."
        ),
    ),
    "CF_3003_6.02": (
        "Vice manager or member without finance edit cannot record cash for others",
        (
            "1. Log in as a vice manager or ordinary member without finance edit.\n"
            "2. Open an approved fund’s detail page — \"Ghi nhận tiền mặt\" is not shown, or the action cannot be completed.\n"
            "3. If any path still appears, attempting submit must not create a cash entry."
        ),
        "The user cannot complete the action: control hidden, disabled, or access denied with a clear message.\n"
        "No new cash transaction is created.",
        "You belong to the club but do not have the finance-edit permission required for this feature.",
    ),
    "CF_3003_7.01": (
        "Member submits a refund request for their own paid contribution",
        (
            "1. Log in as the member who has an approved contribution to the club fund (PayOS or cash).\n"
            "2. Open \"Quản lý Quỹ\" → \"Quỹ của tôi\", select the \"Hoàn tiền\" tab.\n"
            "3. Pick the eligible transaction, enter refund amount, bank name, account number, account holder, optional reason.\n"
            "4. Click \"Gửi yêu cầu hoàn tiền\" and verify the list below on the same page."
        ),
        (
            "Success notification (e.g. \"Đã gửi yêu cầu hoàn tiền\").\n"
            "A new row appears in a waiting-for-club state; you cannot create a second pending request for the same original payment; "
            "total refunded amount cannot exceed the original payment."
        ),
        (
            "You have at least one approved contribution on your account.\n"
            "There is no other pending refund already tied to that same payment."
        ),
    ),
    "CF_3003_7.02": (
        "Member views their own refund requests",
        (
            "1. Stay logged in as an active member.\n"
            "2. Open \"Quản lý Quỹ\" → \"Quỹ của tôi\" → tab \"Hoàn tiền\".\n"
            "3. Use \"Trước\" / \"Sau\" paging if the list is long."
        ),
        "Only your own requests are listed, with correct status and amounts as shown in the UI.",
        "You are an active member of the club.",
    ),
    "CF_3003_7.03": (
        "Top manager views all club refund requests and can filter by status",
        (
            "1. Log in as top manager with finance edit (or admin).\n"
            "2. On \"Quỹ của tôi\" → \"Hoàn tiền\", scroll to the section \"Hàng chờ hoàn tiền (quản lý)\".\n"
            "3. In the \"Trạng thái\" dropdown, choose \"Tất cả\", \"Chờ xử lý\", \"Đã hoàn tất\", \"Từ chối\", or \"Đã hủy\" as offered.\n"
            "4. (Optional QA) If an invalid filter can be forced, observe the error message."
        ),
        "The list shows club-wide requests when the filter is valid.\n"
        "Invalid filter input shows a clear validation error if testable.",
        "You are top manager level 1 with finance edit, or system admin.",
    ),
    "CF_3003_7.04": (
        "Top manager marks a refund as paid / completed",
        (
            "1. Log in as top manager (or admin) with access to \"Hàng chờ hoàn tiền (quản lý)\".\n"
            "2. Open a request still \"Chờ xử lý\" while the fund has enough balance.\n"
            "3. Click \"Hoàn tất\"; in the dialog \"Hoàn tất hoàn tiền\", optionally fill \"Ghi chú quản lý (tuỳ chọn)\", then click \"Xác nhận hoàn tất\".\n"
            "4. Refresh the fund detail or \"Giao dịch\" view to verify balance and expense line."
        ),
        (
            "The request moves to \"Đã hoàn tất\"; fund balance decreases by the refund amount.\n"
            "A matching expense line appears in fund history, linkable to the original contribution as the UI presents it."
        ),
        "Same access as CF_3003_7.03. Request is still pending and the fund has enough balance.",
    ),
    "CF_3003_7.05": (
        "Member cancels their own pending refund request",
        (
            "1. Log in as the member who created the pending refund.\n"
            "2. On the \"Hoàn tiền\" tab, find the row and click \"Hủy yêu cầu\".\n"
            "3. Confirm if a dialog asks for confirmation."
        ),
        (
            "If allowed: status becomes \"Đã hủy\" with success copy such as \"Đã hủy yêu cầu\" / \"Yêu cầu hoàn tiền đã được hủy.\"\n"
            "If cancel is not allowed, an error is shown and status stays unchanged."
        ),
        "A pending refund request exists and was created by the same user who is logged in.",
    ),
    "CF_3003_7.06": (
        "Manager cannot reject a refund with a reason shorter than five characters",
        (
            "1. Log in as top manager with access to refund decisions.\n"
            "2. In \"Hàng chờ hoàn tiền (quản lý)\", click \"Từ chối\" on a pending request.\n"
            "3. In \"Từ chối yêu cầu hoàn\", enter fewer than five characters and click \"Xác nhận từ chối\"."
        ),
        (
            "Reject fails with a clear toast: title \"Thiếu lý do\", message \"Lý do từ chối cần ít nhất 5 ký tự.\" (user-visible copy as implemented in the UI)."
        ),
        "Same manager access as CF_3003_7.03. A pending refund request exists.",
    ),
    "CF_3003_7.07": (
        "Member cannot submit refund request without selecting an original transaction",
        (
            "1. Log in as an active member.\n"
            "2. Open \"Quỹ của tôi\" → tab \"Hoàn tiền\" (member request form).\n"
            "3. Leave \"Giao dịch nộp gốc\" unselected.\n"
            "4. Try submit \"Gửi yêu cầu hoàn tiền\"."
        ),
        "A validation toast appears: title \"Chưa thể gửi yêu cầu\", message \"Chọn giao dịch nộp quỹ đã duyệt của bạn.\" No request is created.",
        "You are a member of the club and can open the refund request form.",
    ),
    "CF_3003_7.08": (
        "Member cannot submit refund request when bank name is missing or exceeds max length",
        (
            "1. Select a valid original transaction.\n"
            "2. Enter a valid refund amount within the remaining refundable amount.\n"
            "3. Leave \"Ngân hàng\" empty OR input more than 100 characters.\n"
            "4. Fill other required fields and submit."
        ),
        "The form blocks submit and shows a toast: title \"Chưa thể gửi yêu cầu\", message \"Tên ngân hàng bắt buộc, tối đa 100 ký tự.\" No request is created.",
        "Same as CF_3003_7.07, and at least one eligible original transaction exists.",
    ),
    "CF_3003_7.09": (
        "Member cannot submit refund request when bank account number is missing or exceeds max length",
        (
            "1. Select a valid original transaction.\n"
            "2. Enter a valid refund amount.\n"
            "3. Leave \"Số tài khoản\" empty OR input more than 32 characters.\n"
            "4. Fill other required fields and submit."
        ),
        "The form blocks submit and shows a toast: \"Số tài khoản bắt buộc, tối đa 32 ký tự.\" No request is created.",
        "Same as CF_3003_7.07.",
    ),
    "CF_3003_7.10": (
        "Member cannot submit refund request when account holder name is missing or exceeds max length",
        (
            "1. Select a valid original transaction.\n"
            "2. Enter a valid refund amount.\n"
            "3. Leave \"Chủ tài khoản\" empty OR input more than 200 characters.\n"
            "4. Fill other required fields and submit."
        ),
        "The form blocks submit and shows a toast: \"Tên chủ tài khoản bắt buộc, tối đa 200 ký tự.\" No request is created.",
        "Same as CF_3003_7.07.",
    ),
    "CF_3003_7.11": (
        "Member cannot submit refund request when requested amount exceeds remaining refundable amount",
        (
            "1. Select an original transaction.\n"
            "2. Note \"Tối đa có thể yêu cầu thêm\" shown below the selector.\n"
            "3. Enter an amount greater than that maximum.\n"
            "4. Submit."
        ),
        "The form blocks submit and shows a toast explaining the maximum refundable amount remaining; no request is created.",
        "Same as CF_3003_7.07. The selected transaction has remaining refundable amount smaller than its original amount (e.g. previous pending/completed refunds exist).",
    ),
    "CF_3003_7.12": (
        "Member can cancel only a PENDING refund request; non-pending requests cannot be cancelled",
        (
            "1. Log in as a member with refund requests in different statuses.\n"
            "2. Open \"Yêu cầu hoàn tiền của tôi\" list.\n"
            "3. Verify that only rows with status \"Chờ xử lý\" show the \"Hủy\" action; other statuses show \"—\".\n"
            "4. Try to cancel a non-pending request (if any UI path exists)."
        ),
        "Only PENDING requests are cancellable from the UI; non-pending cannot be cancelled and no status changes incorrectly.",
        "You have at least one request in PENDING and one in COMPLETED/REJECTED/CANCELLED status.",
    ),
    "CF_3003_7.13": (
        "Member cancels a pending refund request successfully via confirmation dialog",
        (
            "1. In \"Yêu cầu hoàn tiền của tôi\", click \"Hủy\" on a PENDING request.\n"
            "2. Confirm in dialog \"Hủy yêu cầu hoàn tiền?\" by clicking \"Hủy yêu cầu\".\n"
            "3. Observe the toast and verify the status becomes \"Đã hủy\"."
        ),
        "A success toast appears: title \"Đã hủy yêu cầu\", message \"Yêu cầu hoàn tiền đã được hủy.\" The request status becomes CANCELLED.",
        "A pending refund request exists for the logged-in member.",
    ),
    "CF_3003_7.14": (
        "Manager complete-refund dialog rejects manager note longer than max length",
        (
            "1. Log in as top manager and open \"Danh sách yêu cầu hoàn tiền\".\n"
            "2. Click \"Hoàn tất\" on a pending request.\n"
            "3. Enter a manager note longer than 500 characters.\n"
            "4. Click \"Xác nhận hoàn tất\"."
        ),
        "The UI blocks the action and shows an error toast: \"Ghi chú tối đa 500 ký tự.\" The request is not completed.",
        "Same access as CF_3003_7.03. A pending request exists.",
    ),
    "CF_3003_7.15": (
        "Manager reject-refund dialog rejects reason longer than max length",
        (
            "1. Log in as top manager and open a pending request.\n"
            "2. Click \"Từ chối\".\n"
            "3. Enter a rejection reason longer than 2000 characters.\n"
            "4. Click \"Xác nhận từ chối\"."
        ),
        "The UI blocks the action and shows an error toast: \"Lý do tối đa 2000 ký tự.\" The request is not rejected.",
        "Same access as CF_3003_7.03. A pending request exists.",
    ),
    "CF_3003_7.16": (
        "Manager refund queue shows a friendly forbidden message when API returns 403",
        (
            "1. Log in as a user without edit-finance permission or not manager level 1.\n"
            "2. Open the refund queue area \"Danh sách yêu cầu hoàn tiền\".\n"
            "3. Observe the alert content."
        ),
        "A yellow warning box appears with a clear title/detail explaining missing permissions (editfinance and/or manager level 1/Admin), instead of a generic error.",
        "A user exists that triggers 403 for viewing club-wide refund queue.",
    ),
    # Scenario 8 — Manager proactive refunds (create expense refund directly from transactions)
    "CF_3003_8.01": (
        "Manager proactive refund panel lists only eligible transactions (approved member contributions)",
        (
            "1. Log in as club top manager level 1 with finance edit (or system admin).\n"
            "2. Open \"Quỹ của tôi\" → section \"Hoàn tiền chủ động (quản lý)\" (or the equivalent location used in the UI).\n"
            "3. Observe the list of transactions displayed.\n"
            "4. Verify that non-eligible rows are not shown (e.g. non-member contributions, non-income, or non-approved transactions)."
        ),
        (
            "Only transactions that are INCOME + APPROVED and flagged as member contributions are listed.\n"
            "Each row shows fund name, amount, payer label, date/time, and transaction id (\"GD #...\")."
        ),
        (
            "You are logged in as a manager with finance edit permission.\n"
            "The club has a mix of transaction types/statuses in history so the filter behavior is observable."
        ),
    ),
    "CF_3003_8.02": (
        "Manager proactive refund search filters by fund name, payer, or transaction description",
        (
            "1. Open the proactive refund panel.\n"
            "2. In \"Tìm giao dịch\", enter a keyword that matches a fund name.\n"
            "3. Clear and enter a keyword that matches the payer name.\n"
            "4. Clear and enter a keyword that matches the transaction description.\n"
            "5. Observe the list after each search."
        ),
        (
            "The list filters in-page based on the search keyword.\n"
            "Search works for fund name, payer label, and description as displayed in the UI."
        ),
        "Same access as CF_3003_8.01. The list contains rows with distinct values for testing search.",
    ),
    "CF_3003_8.03": (
        "Refund modal pre-fills the refund amount with the remaining refundable amount",
        (
            "1. In the proactive refund panel, choose a transaction that has already been partially refunded (there are prior EXPENSE entries linked to this original transaction).\n"
            "2. Click \"Hoàn tiền\".\n"
            "3. Wait for \"Đang kiểm tra số đã hoàn...\" to finish.\n"
            "4. Check \"Đã hoàn\" and \"Còn có thể hoàn\" in the modal and check the \"Số tiền hoàn\" input default value."
        ),
        (
            "\"Đã hoàn\" equals the sum of approved refund expenses for that original transaction.\n"
            "\"Còn có thể hoàn\" equals original amount minus refunded.\n"
            "\"Số tiền hoàn\" is pre-filled to the remaining amount (or 0 if nothing is refundable)."
        ),
        (
            "Same access as CF_3003_8.01.\n"
            "At least one eligible original transaction exists with previous refund expense lines linked to it."
        ),
    ),
    "CF_3003_8.04": (
        "Cannot create proactive refund when refund amount is zero or invalid",
        (
            "1. Open proactive refund modal for any eligible transaction.\n"
            "2. Enter 0, empty, or invalid characters in \"Số tiền hoàn\".\n"
            "3. Click \"Hoàn tiền\"."
        ),
        (
            "A validation toast appears: title \"Số tiền không hợp lệ\".\n"
            "Refund is not created."
        ),
        "Same access as CF_3003_8.01.",
    ),
    "CF_3003_8.05": (
        "Cannot create proactive refund when amount exceeds remaining refundable amount",
        (
            "1. Open proactive refund modal and wait until remaining refundable amount is shown.\n"
            "2. Enter an amount greater than \"Còn có thể hoàn\".\n"
            "3. Click \"Hoàn tiền\"."
        ),
        (
            "A validation toast appears: title \"Vượt quá số có thể hoàn\".\n"
            "Message states the maximum remaining refundable amount in ₫.\n"
            "No refund is created."
        ),
        "Same access as CF_3003_8.01.",
    ),
    "CF_3003_8.06": (
        "Cannot create proactive refund when optional reason exceeds max length",
        (
            "1. Open proactive refund modal.\n"
            "2. Paste a reason longer than 2000 characters into \"Lý do (tuỳ chọn)\".\n"
            "3. Submit \"Hoàn tiền\"."
        ),
        "A validation error appears (e.g. \"Lý do tối đa 2000 ký tự.\"); refund is not created.",
        "Same access as CF_3003_8.01.",
    ),
    "CF_3003_8.07": (
        "Proactive refund is blocked for users without permission (403)",
        (
            "1. Log in as a user who can view the area but does not have manager finance permission (or use an account that triggers 403 on the refund create API).\n"
            "2. Attempt to create a proactive refund by clicking \"Hoàn tiền\" and submitting the modal."
        ),
        (
            "The action fails with a clear error message such as \"Bạn không có quyền hoàn tiền.\" (or the UI shows the server message).\n"
            "No refund expense is created."
        ),
        "A user account exists that cannot create manager refunds (expected 403).",
    ),
    "CF_3003_8.08": (
        "Proactive refund succeeds and creates an expense history line",
        (
            "1. Log in as top manager with finance edit.\n"
            "2. Open proactive refund modal for an eligible transaction with remaining refundable amount > 0.\n"
            "3. Enter a valid refund amount (≤ remaining) and an optional reason within limit.\n"
            "4. Click \"Hoàn tiền\".\n"
            "5. Verify the success toast and refresh behavior; then check fund history / transactions."
        ),
        (
            "Success toast appears: title \"Đã hoàn tiền\", message \"Giao dịch chi đã được ghi nhận.\".\n"
            "The modal closes and the list refreshes.\n"
            "A new EXPENSE entry exists in history linked to the original transaction id (traceable as designed in the UI).\n"
            "Fund balance decreases accordingly."
        ),
        "Same access as CF_3003_8.01. Fund has enough balance for the refund.",
    ),
}

def _find_row(ws, value: str, col: int = 1) -> int | None:
    for r in range(1, ws.max_row + 1):
        v = ws.cell(row=r, column=col).value
        if v is None:
            continue
        if str(v).strip() == value:
            return r
    return None


def _copy_row_style(ws, src_row: int, dst_row: int, max_col: int = 8) -> None:
    # Copy style + row height to preserve the Excel template look.
    ws.row_dimensions[dst_row].height = ws.row_dimensions[src_row].height
    for c in range(1, max_col + 1):
        src = ws.cell(row=src_row, column=c)
        dst = ws.cell(row=dst_row, column=c)
        dst._style = copy(src._style)  # noqa: SLF001 (openpyxl style copy)
        dst.number_format = src.number_format
        dst.font = copy(src.font)
        dst.border = copy(src.border)
        dst.fill = copy(src.fill)
        dst.alignment = copy(src.alignment)
        dst.protection = copy(src.protection)
        dst.comment = None


def _ensure_refund_request_extra_rows(ws) -> None:
    """
    Ensure extra Scenario 7 test case rows exist (client-side validation + cancel flow + manager limits).
    Insert them after CF_3003_7.06 and before Scenario 8 (if present).
    """
    anchor_id = "CF_3003_7.06"
    anchor_row = _find_row(ws, anchor_id)
    if anchor_row is None:
        return

    new_ids = [f"CF_3003_7.{i:02d}" for i in range(7, 17)]
    missing = [tcid for tcid in new_ids if _find_row(ws, tcid) is None]
    if not missing:
        return

    scenario8_row = _find_row(ws, "Scenario 8- Proactive Refund (Manager)", col=1)
    insert_at = scenario8_row if scenario8_row is not None else (anchor_row + 1)

    ws.insert_rows(insert_at, amount=len(missing))

    template_tc_row = _find_row(ws, anchor_id) or (insert_at - 1)
    for i, tcid in enumerate(missing):
        r = insert_at + i
        _copy_row_style(ws, template_tc_row, r)
        ws.cell(row=r, column=1, value=tcid)
        for c in range(2, 8 + 1):
            ws.cell(row=r, column=c, value=None)


def _ensure_proactive_refund_rows(ws) -> None:
    # Insert Scenario 8 after the last known refund-request test row (Scenario 7).
    anchor_id = "CF_3003_7.06"
    anchor_row = _find_row(ws, anchor_id)
    if anchor_row is None:
        return

    # Use the nearest Scenario row above the anchor as style template (keeps the fill color / bold headers).
    scenario_label_row = None
    for r in range(anchor_row, 0, -1):
        v = ws.cell(row=r, column=1).value
        if isinstance(v, str) and v.strip().startswith("Scenario "):
            scenario_label_row = r
            break
    if scenario_label_row is None:
        scenario_label_row = anchor_row

    existing_s8_row = _find_row(ws, "Scenario 8- Proactive Refund (Manager)", col=1)
    # If Scenario 8 already exists, enforce template styling for the scenario row and test case rows.
    if existing_s8_row is not None:
        _copy_row_style(ws, scenario_label_row, existing_s8_row)
        ws.cell(row=existing_s8_row, column=1, value="Scenario 8- Proactive Refund (Manager)")
        template_tc_row = _find_row(ws, anchor_id) or (existing_s8_row + 1)
        for i in range(1, 9):
            tcid = f"CF_3003_8.{i:02d}"
            r = _find_row(ws, tcid)
            if r is None:
                continue
            _copy_row_style(ws, template_tc_row, r)
            ws.cell(row=r, column=1, value=tcid)
        return

    insert_at = anchor_row + 1
    new_ids = [
        "CF_3003_8.01",
        "CF_3003_8.02",
        "CF_3003_8.03",
        "CF_3003_8.04",
        "CF_3003_8.05",
        "CF_3003_8.06",
        "CF_3003_8.07",
        "CF_3003_8.08",
    ]

    ws.insert_rows(insert_at, amount=1 + len(new_ids))

    # Scenario header row
    _copy_row_style(ws, scenario_label_row, insert_at)
    ws.cell(row=insert_at, column=1, value="Scenario 8- Proactive Refund (Manager)")
    for c in range(2, 8 + 1):
        ws.cell(row=insert_at, column=c, value=None)

    # Test case rows
    template_tc_row = _find_row(ws, anchor_id) or (insert_at + 1)  # after insertion, anchor row shifted
    for i, tcid in enumerate(new_ids):
        r = insert_at + 1 + i
        _copy_row_style(ws, template_tc_row, r)
        ws.cell(row=r, column=1, value=tcid)
        for c in range(2, 8 + 1):
            ws.cell(row=r, column=c, value=None)


def main() -> None:
    if not XLSX.is_file():
        raise SystemExit(f"Missing {XLSX}")

    shutil.copy2(XLSX, BACKUP)

    wb = openpyxl.load_workbook(XLSX)
    # Keep template intact: only update the intended feature sheet.
    ws = wb["Club Fund"] if "Club Fund" in wb.sheetnames else wb.active

    _ensure_refund_request_extra_rows(ws)
    _ensure_proactive_refund_rows(ws)
    ws["B2"] = B2_TEXT

    for row in range(1, ws.max_row + 1):
        cid = ws.cell(row=row, column=1).value
        if not cid:
            continue
        s = str(cid).strip()
        if s in ROWS:
            desc, proc, exp, pre = ROWS[s]
            ws.cell(row=row, column=2, value=desc)
            ws.cell(row=row, column=3, value=proc)
            ws.cell(row=row, column=4, value=exp)
            ws.cell(row=row, column=5, value=pre)

    wb.save(XLSX)
    print(f"Updated {XLSX} (backup: {BACKUP})")


if __name__ == "__main__":
    main()
