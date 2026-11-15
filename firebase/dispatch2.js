var rules = "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n\n    function isMerchant() {\n      return request.auth != null\n        && request.auth.uid == 'NVBntrKCMAN9GY1gatJYz4CKook2';\n    }\n\n    function validStatus(s) {\n      return s in ['new', 'prep', 'ready', 'done'];\n    }\n\n    function validItemsString(v) {\n      return v is string\n        && v.matches('^([A-Z0-9]{6}\\\\.[0-9]{1,3})(,[A-Z0-9]{6}\\\\.[0-9]{1,3})*$')\n        && v.size() <= 700;\n    }\n\n    function validTotal(v) {\n      return v is int && v >= 0 && v <= 1000000;\n    }\n\n    // Private order details (PII). Customers create; only merchant reads/updates/deletes.\n    match /orders/{id} {\n      allow create: if false; // PAUSED: region change pending client's explicit country choice\n      allow read, delete: if isMerchant();\n      allow update: if isMerchant()\n        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])\n        && validStatus(request.resource.data.status);\n    }\n\n    // Public minimal status (no PII). Anyone can GET one doc by its unguessable id; no listing.\n    match /order_status/{id} {\n      allow create: if false; // PAUSED: region change pending client's explicit country choice\n        // Linkage is enforced from the orders side: a private order cannot exist\n        // without its matching public status doc. A lone status doc is inert\n        // (no PII, no listing, unguessable id).\n      allow get: if true;\n      allow list: if false;\n      allow update: if isMerchant()\n        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])\n        && validStatus(request.resource.data.status);\n      allow delete: if isMerchant();\n    }\n  }\n}\n";
var el = document.querySelector('.cm-editor .cm-content');
if (!el || !el.cmView) { 'NO_EDITOR'; } else {
  var v = el.cmView.view;
  var CM = v.state;
  v.dispatch({changes:{from:0,to:v.state.doc.length,insert:rules},
    annotations: (v.state.facet ? [] : [])});
  // try userEvent annotation via the view's available constructors
  try {
    var ann = v.state.annotation;
  } catch(e) {}
  'DISPATCHED2 ' + v.state.doc.length;
}