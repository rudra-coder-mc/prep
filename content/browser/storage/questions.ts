import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'strings-only-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-1',
    prompt:
      'What does localStorage actually store, and what does getItem return for a missing key?',
    options: [
      'Any JSON-serialisable value, serialised for you on write and revived on read, with undefined for a missing key',
      'Strings and nothing else, so every other type has to be serialised by your own code, and null for a missing key',
      'Strings for primitives and structured clones for objects, with null for a missing key',
      'Whatever you put in, held in memory for the session and flushed to disk on unload, with undefined for a missing key',
    ],
    correctOption: 1,
    answerInFull: `Strings, and null.

Both halves catch people, and they catch them in different ways.

Every value is stored as a string. Not converted helpfully: coerced, the way string concatenation coerces. A number comes back as a number-shaped string, so a count read back and incremented gives you "51" rather than 6. An object comes back as the literal text object Object, because that is what its toString produces, and the data is simply gone.

So the round trip is yours to write, and both halves of it can fail:

    localStorage.setItem('settings', JSON.stringify(settings))

    const raw = localStorage.getItem('settings')
    const settings = raw ? JSON.parse(raw) : defaults

That guard is not defensiveness for its own sake. A half-written value from an older version of your code, or a key someone edited in devtools, is a SyntaxError thrown at module load, and the page renders nothing at all. Reads belong in a function that catches, returns the default, and removes the bad key.

The missing key returns null rather than undefined, which matters because the two behave differently in the places you check them. It also means the string "null", written by stringifying a null, is indistinguishable from an absent key once it comes back through JSON.parse.

Worth knowing for the follow-up: this is exactly the difference IndexedDB does not have. It uses structured clone, so a Date is a Date and a Map is a Map, with no serialisation of your own.`,
    explanation: `Automatic serialisation is what people remember, probably because every wrapper library adds it. The API itself has none.

There is no split behaviour by type. setItem calls toString on whatever you give it, including objects.

And nothing is deferred to unload. Writes are synchronous and hit the disk, which is the property that makes this API expensive.`,
    hints: ['What does an object become when it is coerced to a string?'],
    tags: ['storage', 'localstorage'],
  },
  {
    id: 'synchronous-cost-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'Why is "we keep application state in localStorage" a problem worth raising in a code review?',
    options: [
      'Because localStorage is cleared when the browser restarts, so the state is lost exactly when the user expects it to be kept',
      'Because localStorage is shared across all origins on the same host, so another site on a different port can read the state',
      'Because every read and write is synchronous and blocks the main thread, there are no transactions so concurrent tabs lose writes, and the quota is a few megabytes',
      'Because writes are batched and flushed asynchronously, so state written just before a navigation is frequently lost',
    ],
    correctOption: 2,
    answerInFull: `Three separate problems, and the synchronous one is the important one.

Every read and write blocks the main thread, including the disk access underneath it. It is also shared across tabs, so a read can block behind another tab's write. That is fine for a theme or a feature flag, read once at startup. It is not fine in a loop, in a scroll handler, or for anything large: reading a megabyte of JSON out of localStorage at load parses that megabyte before your first paint, on the same thread that would otherwise be rendering.

There are no transactions. Two tabs that both read, modify and write the same key produce a lost update, and nothing tells you. IndexedDB has real transactions precisely because this is not solvable at the application level.

And the quota is five to ten megabytes per origin, with setItem throwing a QuotaExceededError when it runs out. Private browsing modes have historically had a quota of zero, so this is a failure you may never see in development.

The fourth cost is the one from the previous question: strings only, so every access is a serialise or a parse, which is more main thread work on top of the blocking.

The answer to all four is IndexedDB, which is asynchronous, transactional, large and stores structured values. The reason people do not reach for it is that its raw API is verbose and event based, and the reason that is not a good reason is that a four kilobyte wrapper turns it into promises.

localStorage remains right for exactly what it looks like: a handful of small preferences.`,
    explanation: `localStorage explicitly survives a browser restart. sessionStorage is the one tied to a lifetime, and it is tied to the tab.

Storage is partitioned by origin, and an origin is scheme, host and port, so a different port is a different origin and cannot see it.

Writes are not batched or deferred. If they were, this API would be considerably cheaper to use.`,
    hints: ['What is the thread doing while the disk is being read?'],
    tags: ['storage', 'performance'],
  },
  {
    id: 'storage-timing-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'db is an already-open IndexedDB handle wrapped in promises. Put the lines this prints in the order it prints them.',
    code: `console.log('start')

db.get('settings').then(() => console.log('idb read'))
localStorage.setItem('theme', 'dark')
console.log('local write done')

queueMicrotask(() => console.log('microtask'))
console.log('end')`,
    items: [
      'microtask',
      'start',
      'storage event',
      'local write done',
      'idb read',
      'end',
      'local write queued',
      'idb write done',
    ],
    correctOrder: [1, 3, 5, 0, 4],
    answerInFull: `start, local write done, end, microtask, idb read.

The question is one contrast written as an output ordering: web storage is synchronous and IndexedDB is not.

setItem does its work before the next line runs. There is no queue, no promise and nothing to await; the call returns when the value is stored, which is why local write done prints in source order alongside start and end. That is the convenience, and it is also the cost, because the thread is doing disk work while it sits there.

The IndexedDB read is a real asynchronous operation. Its result arrives in a later task, so it prints last, after the synchronous code and after the microtask queue has drained.

The microtask is ordinary event loop behaviour and is in the question to place the IndexedDB result rather than to be interesting on its own: microtasks run at the end of the current task, and anything waiting on the database is in a task after that.

Two lines that never print are worth naming. There is no storage event, because that event fires in every other tab on the origin and never in the tab that made the change. And nothing about the localStorage write is queued, which is the misconception the question is built around.`,
    hints: ['Which of these two storage calls has to wait for anything?'],
    tags: ['storage', 'event-loop'],
  },
  {
    id: 'round-trip-output',
    type: 'output',
    form: 'choice',
    difficulty: 'easy',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `localStorage.setItem('count', 5)
localStorage.setItem('user', { name: 'Ada' })

console.log(localStorage.getItem('count') + 1)
console.log(localStorage.getItem('user').name)
console.log(localStorage.getItem('missing'))`,
    options: [
      "6, then 'Ada', then undefined",
      "'51', then undefined, then null",
      '6, then undefined, then null',
      "'51', then a TypeError from reading name on a string, and the third line never runs",
    ],
    correctOption: 1,
    answerInFull: `'51', then undefined, then null.

Three separate consequences of the same rule: every value is coerced to a string on the way in.

The number 5 is stored as "5". Reading it gives the string "5", and adding 1 to a string concatenates, so the first line is "51". This is the bug that shows up as a counter that grows by a digit instead of by one.

The object is stored as the result of its toString, which is the literal text "[object Object]". The data is gone; there is nothing to recover. Reading a name property off that string gives undefined, because a string has no name property. It does not throw, which is what makes this quiet: strings are objects enough to be read from, so the failure surfaces later as undefined somewhere else.

The missing key gives null. Not undefined, which matters wherever the two are checked differently, and not an error.

The fix is a serialise on the way in and a guarded parse on the way out, in one place rather than at every call site:

    function read(key, fallback) {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      try {
        return JSON.parse(raw)
      } catch {
        localStorage.removeItem(key)
        return fallback
      }
    }`,
    explanation: `Expecting 6 and a usable object is the assumption that the API serialises for you, which every wrapper library does and the platform does not.

The TypeError does not happen because reading a missing property off a string is not an error. If it threw, this would be a much easier bug to find.

undefined for the missing key is the natural guess from working with plain objects. Web storage returns null.`,
    hints: ['What is stored, before anything is read back?'],
    tags: ['storage', 'localstorage'],
  },
  {
    id: 'storage-event-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'Two tabs on the same origin both run this code. The user clicks the toggle in tab 1. What is logged, and where?',
    code: `window.addEventListener('storage', (event) => {
  console.log('storage event', event.key, event.newValue)
})

toggle.addEventListener('click', () => {
  localStorage.setItem('theme', 'light')
  console.log('wrote theme')
})`,
    options: [
      'Tab 1 logs "wrote theme" then "storage event theme light". Tab 2 logs "storage event theme light"',
      'Tab 1 logs "wrote theme" only, and tab 2 logs nothing until it is focused, when the event is delivered',
      'Both tabs log "storage event theme light", and neither logs "wrote theme", because the listener runs before the click handler finishes',
      'Tab 1 logs "wrote theme" only. Tab 2 logs "storage event theme light"',
    ],
    correctOption: 3,
    answerInFull: `Tab 1 logs "wrote theme" and nothing else. Tab 2 logs the storage event.

The rule is that the storage event fires in every other document on the origin, never in the one that made the change. The reasoning is that the tab that wrote already knows: it has the value, it is at the line after the write, and delivering an event to it would be telling it something it just did.

This catches everyone once, and the symptom is a UI that updates in every tab except the one you are using. The fix is to do both things at the point of the change: update your own interface directly, and let the event handle the others. Extracting an applyTheme function called from both places is the usual shape.

It is also genuinely useful, and worth naming the two things it is good at. Logging out of every tab at once, by watching for the auth key becoming null. And keeping a preference in step, which is this example.

    window.addEventListener('storage', (event) => {
      if (event.key === 'auth' && event.newValue === null) redirectToLogin()
    })

Three details for the follow-up. The event object carries key, oldValue, newValue, url and storageArea, so you can tell which storage and which key. Calling clear fires an event with a null key. And when cross-tab messaging is the actual goal rather than a side effect of storing something, BroadcastChannel is the better tool, because it does not require writing to disk in order to say something.`,
    explanation: `Firing in the writing tab as well is the intuitive expectation and is the one thing the specification rules out.

There is no deferred delivery on focus. The event fires in other tabs as they receive it, whether or not anyone is looking at them.

And a listener cannot pre-empt the handler that is running. The write is synchronous and the log after it happens immediately.`,
    hints: ['Who already knows about the change?'],
    tags: ['storage', 'events'],
  },
  {
    id: 'httponly-cookie-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'The user is logged in and authenticated requests work. This check always sends them to the login page. The session cookie is visible in the browser devtools cookie panel. Why?',
    code: `function isLoggedIn() {
  return document.cookie.includes('session=')
}`,
    options: [
      'Because document.cookie only exposes cookies set by JavaScript, and this one was set by a Set-Cookie response header',
      'Because the cookie is HttpOnly, so it is sent with every request and is deliberately invisible to document.cookie, even though devtools can show it',
      'Because document.cookie is asynchronous in modern browsers and returns a promise, so includes is being called on a promise rather than on a string',
      'Because the cookie has a Path attribute that does not match the current page, so it is not sent and not readable here',
    ],
    correctOption: 1,
    answerInFull: `Because the cookie is HttpOnly, which is exactly what you want and is incompatible with this check.

HttpOnly means the cookie participates in requests and is invisible to script. document.cookie cannot read it and cannot overwrite it. Devtools sits outside the page's JavaScript, so it shows the cookie and marks it HttpOnly in a column that is easy to miss.

Only a server can set that flag. A cookie set from document.cookie can never be HttpOnly, for the obvious reason: if script can set it, script can read it.

So the bug is a design problem rather than a syntax one. The page is trying to learn its authentication state from something it has correctly been denied access to. Three ways out, in the order I would consider them.

Have the server tell you. The page is rendered by something that knows whether the request was authenticated, so it can render that fact, into markup, into a data attribute, or into an endpoint the app calls once at startup.

Set a second, non-HttpOnly cookie or a localStorage flag that carries no authority: a boolean, or a username for display. It is a hint for the interface, not a credential, and treating it as anything else re-creates the problem.

Or stop asking, and let the failure answer it. Make the request, and treat a 401 as not logged in. That is the only answer that is actually true at the moment it matters, because a cookie can be present and expired.

The general point worth saying out loud: any check the client can make about its own authentication is advisory. The server decides, and the client is guessing to avoid a round trip.`,
    explanation: `The origin of a cookie is irrelevant to whether script can read it. A cookie set by a Set-Cookie header without HttpOnly is readable from document.cookie.

document.cookie is synchronous and returns a string. cookieStore is the asynchronous replacement, and it is a different API with a different name.

Path is a real reason a cookie might not be readable, and it would also stop the cookie being sent, so the authenticated requests would be failing too. They are not.`,
    hints: ['What is the point of the flag that devtools is showing in a column?'],
    tags: ['storage', 'cookies', 'security'],
  },
  {
    id: 'corrupt-value-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A few users see a completely blank page. Their console has a SyntaxError from JSON.parse, thrown while this module is still evaluating. The code has not changed in months, it works for everyone else, and clearing site data fixes it permanently for whoever does it. What happened?',
    code: `const stored = localStorage.getItem('settings')
const settings = stored ? JSON.parse(stored) : defaults

export function isEnabled(flag) {
  return settings.flags[flag] === true
}`,
    options: [
      'The key is missing for those users, so JSON.parse is called on null, and parsing null throws',
      'The value was written when the origin was near its quota, so the browser stored as much of the string as fitted, and the truncated JSON cannot be parsed',
      'An older version of the code wrote the object without stringifying it, so the stored value is the literal text [object Object]. Every load since has thrown on it, and nothing removes it',
      'Two tabs wrote the key at the same moment, so the two values interleaved and left a mixture of both',
    ],
    correctOption: 2,
    answerInFull: `Something wrote a value that is not JSON, and the code has been reading it ever since.

setItem coerces. Pass it an object and it stores the result of toString, which is the literal text [object Object]. That write may have happened one release ago, in code nobody has looked at since, and the bad value outlives the mistake, because nothing goes back and cleans it up. The user is stuck with a permanently blank page until they clear site data, which is why only some people see it and why the fix they found works.

The guard on the second line is the part worth looking at, because it looks like it handles this and does not. It asks whether there is a value, not whether the value is any good, so it protects against a missing key and nothing else.

Two things make it fatal rather than annoying. It runs at module scope, so the throw happens while the module is evaluating and nothing renders at all. And it throws on every load, so the state that caused it can never be repaired by the app.

The fix is to read through one function that treats stored data as untrusted input, because that is what it is:

    function read(key, fallback) {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      try {
        return JSON.parse(raw)
      } catch {
        localStorage.removeItem(key)
        return fallback
      }
    }

Removing the bad key matters as much as catching. Without it the next load throws again, and the user is still stuck.

The general point is the one to say out loud in an interview. Storage is a persistent interface with a schema and no migrations unless you write them. Anything you have ever written is still out there in the shape you wrote it, on the machines of users who have not been back since. Version the key, or version the value, and decide what happens to the shapes you no longer understand.`,
    explanation: `Parsing null does not throw. JSON.parse coerces its argument to a string first, so it sees "null" and returns null, which is valid JSON and one of the reasons a missing key fails quietly rather than loudly. The guard would stop null reaching it in any case, which is the other half of why that option cannot be it.

setItem never truncates. Exceeding the quota raises a QuotaExceededError and stores nothing, so a partial value is not a state it can produce.

And each setItem is atomic, so concurrent tabs do not interleave characters. What they do produce is a lost update, where one tab's whole value replaces the other's, and both values were valid JSON.`,
    hints: ['What does the guard on the second line actually check?'],
    tags: ['storage', 'json'],
  },
  {
    id: 'quota-write-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A page saves the draft the user is typing to localStorage on every change. On some devices the save silently stops working and the draft is lost. Which save is right?',
    options: [
      'Measure JSON.stringify(draft).length before writing, and skip the write when it would take the origin past five megabytes',
      'Catch QuotaExceededError, call localStorage.clear(), and retry the same write once',
      'Move the write into queueMicrotask, so a failure cannot interrupt the code that scheduled it',
      'Wrap setItem in try/catch, treat any throw as storage being unavailable rather than testing for one error name, and tell the caller the save failed',
    ],
    correctOption: 3,
    answerInFull: `Catch, do not diagnose, and never fail silently.

    function save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch {
        return false
      }
    }

Catching anything rather than one named error is deliberate. A write can fail because the origin is out of room, and it can also fail because storage is not available at all: private browsing modes have historically had a quota of zero, and some configurations refuse the whole API. The name you get back has not been consistent across browsers either, so branching on it is a check that works in the browser you tested and not in the one that has the problem.

Counting your own bytes cannot work, for three separate reasons. The quota is between five and ten megabytes depending on the browser, so there is no number to compare against. It belongs to the origin rather than to your key, so everything else on the page is spending from the same budget. And a string is stored as UTF-16, so a character is two bytes and length is not the measurement you think it is.

The part of the prompt that names the actual bug is the word silently. A save that failed and said nothing is worse than one that threw, because the user carries on typing into something that is not being kept. Returning false gives the caller something to act on: warn, stop showing a saved indicator, or fall back.

And when the thing being saved is genuinely large, the answer is not a better catch. It is IndexedDB, which is asynchronous, has a quota measured in hundreds of megabytes, and does not block the main thread on the way.`,
    explanation: `Clearing everything to make room for one draft destroys keys that belong to other features, including whatever else the app is keeping there, and the retry can still fail. Evicting your own oldest entries is the version of this idea that is defensible.

Deferring the write changes nothing about the failure. setItem is synchronous whenever it runs, and a microtask puts the throw outside the caller's try/catch, so the one thing it reliably achieves is making the error harder to handle.`,
    hints: ['Which failure does the private browsing case share with the quota case?'],
    tags: ['storage', 'quota'],
  },
  {
    id: 'idb-transaction-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'hard',
    tier: 'staff',
    prompt:
      'Saving a note writes the note and its attachment to IndexedDB, then records an audit row once the server has accepted it. Which shape works?',
    options: [
      'One readwrite transaction for the note and the attachment, awaited to completion. Then the fetch, with no transaction open. Then a second transaction for the audit row',
      'One readwrite transaction for all three writes, awaiting the fetch between the second write and the third, so the whole save is atomic',
      'A transaction per write, awaited in order, so no transaction is ever open across the network call',
      'One readwrite transaction for all three, kept alive across the fetch by issuing a read from each request callback so it never goes idle',
    ],
    correctOption: 0,
    answerInFull: `Two transactions, with the network call outside both.

The rule underneath this is the one thing about IndexedDB that surprises people who learned promises first. A transaction is active for the task that created it and for the callbacks of requests made inside it. When control returns to the event loop with nothing pending, it commits itself. Nobody closes it and there is no method to hold it open.

So awaiting anything that is not part of the transaction ends it, and the write after the await throws TransactionInactiveError. A fetch is the clearest case, because it is guaranteed to take a turn of the event loop, but the rule is broader than that: await nothing inside a transaction except the transaction's own requests.

Which turns the question into a design one. What must be atomic? The note and its attachment: half a note is a state the reader should never see, and one transaction gives you that. The audit row is a consequence of what the server said, so it cannot be in the same transaction as writes that happened before the server was asked, and no amount of API cleverness will change that.

The honest answer to "but then the two can disagree" is that they can, and that this is what reconciliation on startup is for. If the page dies between the fetch and the audit row, the note is saved and unrecorded, so the next start looks for notes with no audit row and finishes the job. That is the same problem every system has when it writes to two places, and the same answer.

    const tx = db.transaction(['notes', 'files'], 'readwrite')
    await Promise.all([tx.objectStore('notes').put(note), tx.objectStore('files').put(file), tx.done])

    await api.save(note)

    await db.put('audit', { id: note.id, at: new Date() })

Worth knowing for the follow-up: this is also why IndexedDB gives you real atomicity and localStorage does not. A transaction over several stores either happens or does not, which is the difference between the two that matters most once more than one tab is writing.`,
    explanation: `The atomic version is the intuitive one and is exactly what the rule forbids. The third put throws TransactionInactiveError, and the two writes before it have already committed, so it fails in the least useful way available.

A transaction per write is the right instinct with the wrong boundary. It keeps the network call clear, and it also lets a note be stored without its attachment, with nothing to roll back.

Keeping a transaction alive by issuing requests from inside callbacks is a real technique, and it does not survive an await on a fetch, because resuming after a network response is not a request callback. Holding a readwrite transaction across the network would also block every other write to those stores while it waited.`,
    hints: ['When does a transaction commit, given that nothing tells it to?'],
    tags: ['storage', 'indexeddb', 'transactions'],
  },
  {
    id: 'where-drafts-go-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'A notes feature keeps drafts locally: long text, an image attachment, the date it was last edited, and a set of tags. It is in localStorage today, the app takes a second to become interactive on a slow phone, and saves have started failing for the heaviest users. Where does it go?',
    options: [
      'Stay in localStorage and cut the size: shorten the JSON keys, store the image as base64, and drop the oldest drafts as the origin approaches its quota',
      'IndexedDB. Asynchronous, so the read stops blocking the first paint, hundreds of megabytes rather than five, transactional, and structured clone, so the date is a Date and the image is a Blob with no serialisation of your own',
      'A cookie with a long Max-Age, so the drafts persist and the server can restore them when the user changes device',
      'sessionStorage, since a draft belongs to the tab it is being typed in, which also keeps it clear of the localStorage quota',
    ],
    correctOption: 1,
    answerInFull: `IndexedDB, and every symptom in the question is one of its four differences.

The slow start is the synchronous read. Pulling a megabyte of drafts out of localStorage at load blocks the main thread on disk and then parses that megabyte, all before the first paint, on the thread that would otherwise be rendering. IndexedDB reads are asynchronous, so the page paints and the drafts arrive.

The failing saves are the quota. Five to ten megabytes per origin, shared with everything else on the page, and setItem throws when it runs out. IndexedDB is measured in hundreds of megabytes, and on most browsers in a percentage of what the disk has free.

The image and the date are the interesting part, because this is where structured clone stops being trivia. IndexedDB does not serialise to text. It stores a structured clone, which keeps Date, Map, Set, RegExp, ArrayBuffer, Blob and File, and handles cycles. So the last edited date comes back as a Date, the tags come back as a Set, and the image is stored as the Blob it already is rather than as base64 text. Through JSON, all three are lossy: the date becomes a string, the Set becomes an empty object, and the file cannot go at all.

What structured clone refuses is worth knowing too: functions, symbols, DOM nodes, and class identity, so an instance comes back as a plain object with the same properties on it.

And drafts are the case that wants transactions. Two tabs editing the same note in localStorage is a read, a modify and a write with nothing coordinating them, so one tab's work disappears.

Two things stay behind. Small preferences belong in localStorage, because one synchronous line is genuinely simpler and a theme is not worth a database. And use a wrapper: the raw API is event based and older than promises, and idb is about four kilobytes. Being able to say what a version, an object store, a key path and an index are matters more in an interview than reciting the event names.`,
    explanation: `Shrinking the payload treats the symptom. Base64 makes an image about a third larger, the read is still synchronous, and the next heavier user hits the same wall.

A cookie is around four kilobytes, browsers cap how many a domain may have, and every one of those bytes is uploaded with every request the page makes, including every image. It is also the wrong mechanism: a cookie is a message to the server, and the server was never asked for these.

sessionStorage really does have its own quota, and it is the same API with the same synchronous reads and the same strings, plus the one property a draft cannot have, which is that it disappears when the tab closes.`,
    hints: [
      'Which of the four differences explains the slow start, and which explains the failing save?',
    ],
    tags: ['storage', 'indexeddb'],
  },
  {
    id: 'token-storage-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      '"Where do you store a session token?" Give the answer, then give the follow-up an interviewer is waiting for.',
    answerInFull: `Not in localStorage. An HttpOnly, Secure, SameSite cookie, with CSRF protection alongside it. Then the reasoning, which is the part being marked.

localStorage is readable by any JavaScript running on the page. That is not only your code: it is every dependency, every script a dependency loads, and anything an attacker manages to inject. One cross-site scripting hole reads the token, sends it elsewhere, and the token keeps working from a machine that is not the user's, for as long as it is valid.

An HttpOnly cookie is not readable by script at all. document.cookie cannot see it and cannot overwrite it, and only a server can set that flag, for the obvious reason that script which can set it can read it. An attacker with a script on your page can still make requests as the user, because the browser attaches the cookie for them, but they cannot take the token away with them. The damage is confined to your origin and to the time your page is open, which is a real and meaningful difference.

The cost of a cookie that is sent automatically is that it is sent on requests the user did not initiate, which is cross-site request forgery. SameSite=Lax is the modern default and covers most of it: the cookie goes on top-level navigation and not on a cross-site fetch or form post. A server that cares still wants a CSRF token, because Lax is a default rather than a guarantee.

Now the follow-up, which is where the answer is either honest or memorised. Cross-site scripting defeats both. With script running on your page, an attacker can act as the user whatever you did with the token. HttpOnly limits the blast radius, it does not remove it, and the real defences are a content security policy, output encoding, and not shipping the hole. Anyone who says a cookie makes them safe from XSS has learned the answer rather than the reason.

The pattern most teams land on, and the one I would propose: a short-lived access token held in a JavaScript variable and nowhere else, so it dies with the page, and a long-lived refresh token in an HttpOnly, Secure, SameSite cookie scoped to the refresh endpoint alone. Nothing durable is ever readable by script, the access token expires in minutes, and a page reload costs one refresh call.

Two things worth adding if there is room. Any check the page makes about its own authentication is advisory, because the server decides and the client is guessing to save a round trip. And if the answer has to be a token in a header, because the API is cross-origin and cookies are not on the table, then say so and say what you would do instead: keep it in memory, accept that a reload logs the user out or costs a refresh, and never write it down.`,
    hints: [
      'What can each option not protect against, and what does it limit?',
      'Where does the access token live if nothing durable is readable by script?',
    ],
    tags: ['storage', 'cookies', 'security'],
  },
]
