# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.js >> scanner decodes an actual QR image and invalidates the displayed ticket on undo paid
- Location: tests\browser\admin.spec.js:115:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, copyfile 'C:\Users\Iyad Shehadeh\Desktop\Projects\MME-Lunch\frontend\test-results\.playwright-artifacts-0\traces\73482573f1568b679d78-91f4ed3af18db9cd406d-recording3.network' -> 'C:\Users\Iyad Shehadeh\Desktop\Projects\MME-Lunch\frontend\test-results\.playwright-artifacts-0\traces\73482573f1568b679d78-91f4ed3af18db9cd406d-recording3-pwnetcopy-1.network'
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [aria-hidden] [ref=e5]: MME
    - generic [ref=e6]:
      - strong [ref=e7]: Mechanical & Mechatronics Engineering
      - generic [ref=e8]: Lunch administration
    - button "Log out" [ref=e9] [cursor=pointer]
  - main [ref=e10]:
    - navigation "Admin pages" [ref=e11]:
      - link "Overview" [ref=e12] [cursor=pointer]:
        - /url: /admin/overview/
      - link "Orders" [ref=e13] [cursor=pointer]:
        - /url: /admin/
      - link "Scan tickets" [ref=e14] [cursor=pointer]:
        - /url: /admin/scan/
      - link "Ordering deadline" [ref=e15] [cursor=pointer]:
        - /url: /admin/deadline/
    - generic [ref=e16]:
      - heading "Scan tickets" [level=2] [ref=e17]
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic "QR scanner camera preview" [ref=e21]
            - generic [ref=e22]: Position a ticket inside the frame
          - generic [ref=e26]:
            - button "Scan next ticket" [ref=e27] [cursor=pointer]
            - generic [ref=e28] [cursor=pointer]:
              - text: Upload QR image
              - button "Upload QR image" [ref=e29]
        - generic [ref=e30]:
          - heading "Ticket lookup" [level=3] [ref=e31]
          - generic [ref=e32]:
            - generic [ref=e33]: Ticket link
            - textbox "Ticket link" [ref=e34]:
              - /placeholder: https://…/admin/checkout/?key=…
            - button "Look up ticket" [ref=e35] [cursor=pointer]
      - article [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e38]:
            - generic [ref=e39]: Valid paid ticket
            - heading "Maya Test · $15" [level=3] [ref=e40]:
              - text: Maya Test
              - generic [ref=e41]: · $15
          - generic [ref=e42]:
            - generic [ref=e43]: Paid
            - generic [ref=e44]: Not entered
            - generic [ref=e45]: Not received
        - generic [ref=e46]:
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]: Department
              - generic [ref=e50]: Mechanical Engineering
            - generic [ref=e51]:
              - generic [ref=e52]: University ID
              - generic [ref=e53]: "123"
            - generic [ref=e54]:
              - generic [ref=e55]: Email
              - generic [ref=e56]: maya@example.com
          - list [ref=e57]:
            - listitem [ref=e58]:
              - generic [ref=e59]:
                - generic [ref=e60]: Meal 1
                - strong [ref=e61]: Burgers
              - generic [ref=e62]:
                - generic [ref=e63]: Requested
                - list [ref=e64]:
                  - listitem [ref=e65]: ×1 Chicken
                  - listitem [ref=e66]: ×1 Meat
              - generic [ref=e67]:
                - generic [ref=e68]: Note
                - generic [ref=e69]: No onions
            - listitem [ref=e70]:
              - strong [ref=e72]: Servings
              - list [ref=e73]:
                - listitem [ref=e74]: Ketchup ×1
                - listitem [ref=e75]: Coleslaw ×1
                - listitem [ref=e76]: Beverage ×1
                - listitem [ref=e77]: Fries ×1
          - status [ref=e78]:
            - text: Ticket email has not been submitted yet.
            - button "Send ticket email" [ref=e79] [cursor=pointer]
          - generic [ref=e80]:
            - button "Undo paid" [ref=e81] [cursor=pointer]
            - button "Mark as entered" [ref=e82] [cursor=pointer]
            - button "Mark order received" [ref=e83] [cursor=pointer]
```