# QA Checklist (Bloop)

- [ ] App loads at `http://localhost:8000` without console errors.
- [ ] Creating task with empty title is blocked and shows validation message.
- [ ] Creating task with title only works (due date optional).
- [ ] New task defaults to priority `med` unless changed.
- [ ] Priority badge reflects selected level (`low` / `med` / `high`).
- [ ] "Mark Done" toggles task to done state (title strike-through).
- [ ] "Mark Open" toggles a done task back to open.
- [ ] Filter `All` shows every task.
- [ ] Filter `Open` hides done tasks.
- [ ] Filter `Done` hides open tasks.
- [ ] Refreshing browser keeps tasks and done/open state (localStorage persistence).
