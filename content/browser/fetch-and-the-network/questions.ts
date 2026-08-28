import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'not-ok-not-rejected-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'When does the promise returned by fetch reject?',
    options: [
      'On any status outside the 200 range, since those are the statuses that mean the request did not succeed',
      'Only when no response was received at all: a network or DNS failure, a request blocked by CORS or an extension, or an abort',
      'On any status of 500 or above, since 4xx statuses are answers and 5xx statuses are failures',
      'Whenever the response body cannot be parsed as the type you asked for, which is how a failed request surfaces',
    ],
    correctOption: 1,
    answerInFull: `Only when there was no response. Network or DNS failure, a refused connection, a request blocked by CORS or by an extension, and an abort. That is the whole list.

Every response the server actually sent fulfils the promise, including 404, 500 and 503. Those are answers. The request succeeded and you did not like the reply.

The reasoning is worth being able to give, because the design looks wrong until you hear it. A rejection means the operation could not be performed, and asking a server a question it answered with "no" is an operation that was performed. It also keeps the layers separate: HTTP status semantics belong to your application, not to the transport. Plenty of APIs return a 404 to mean an empty result, and a transport that turned that into an exception would be making a decision it cannot make correctly.

The consequence is that every fetch needs a status check, and the version written by hand at a call site is the one that gets forgotten.

    const response = await fetch(url)
    if (!response.ok) throw new HttpError(response.status, await response.text())
    return response.json()

response.ok is true for 200 to 299. Put that in a wrapper and call the wrapper.

The reason this matters more than it sounds: without the check, a 500 whose body is an HTML error page surfaces as a SyntaxError about an unexpected token, from the json call, one promise later than the thing that actually went wrong and mentioning nothing about the status.`,
    explanation: `Rejecting outside the 200 range is what XMLHttpRequest wrappers and most libraries do, and it is why the fetch behaviour surprises people who learned on axios.

The 4xx against 5xx split does not exist here. Both are responses and both fulfil.

A body that will not parse does reject, from the json call rather than from the fetch call. That is the symptom of the missing check, not the mechanism.`,
    hints: ['Did the server answer, or did it not?'],
    tags: ['fetch', 'errors'],
  },
  {
    id: 'body-read-once-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Why does calling response.json() after response.text() throw?',
    options: [
      'Because json caches its parsed result on the response, and text invalidates that cache, leaving the response in an inconsistent state',
      'Because the body is a stream, and a stream can be consumed once. text drained it, so there is nothing left for json to read',
      'Because a response can only be read in the same microtask it arrived in, and the second call happens a turn later',
      'Because the two methods lock the response to different content types, and a response can only be interpreted as one type',
    ],
    correctOption: 1,
    answerInFull: `Because the body is a ReadableStream, and a stream is consumed as it is read. There is nothing left to read a second time.

That is a deliberate design rather than a limitation. Buffering every response so it could be read twice would mean holding every response in memory, and a body can be a video. Streaming is what lets you process a large response as it arrives, which is how progress reporting and streaming responses work at all.

There is a flag, response.bodyUsed, and an escape hatch, response.clone(), which gives you a second reader over the same data at the cost of buffering it. clone has to be called before anything has read the body; afterwards it is too late.

The place this actually bites is error handling, because the useful thing to do with a failure is read the body for a message and the useful thing to do with a success is parse it. That works if only one branch reads:

    const response = await fetch(url)
    if (!response.ok) throw new HttpError(response.status, await response.text())
    return response.json()

What does not work is a logging layer that reads the body and then passes the response on, which is exactly the shape an interceptor takes. Clone in the interceptor, or read once and pass the value rather than the response.

Related and worth knowing: response.headers is a Headers object rather than a plain object. It has get, it is case-insensitive, and spreading it gives you nothing.`,
    explanation: `There is no parse cache being invalidated. Nothing was stored; the bytes went past.

Timing is not the constraint. A response read minutes later reads fine, as long as it has not been read before.

Content type is not locked either. You can read any body as text, including an image, and get nonsense rather than an error.`,
    hints: ['What kind of object is a body, before any of these methods touch it?'],
    tags: ['fetch', 'streams'],
  },
  {
    id: 'two-promises-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt:
      'The server answers this request with a 404 whose body is the JSON array []. Put the lines this prints in the order it prints them.',
    code: `console.log('start')

fetch('/missing')
  .then((response) => {
    console.log('resolved ' + response.ok)
    return response.json()
  })
  .then((data) => console.log('parsed ' + data.length))
  .catch(() => console.log('caught'))

queueMicrotask(() => console.log('microtask'))
console.log('end')`,
    items: [
      'resolved true',
      'start',
      'caught',
      'microtask',
      'end',
      'parsed 0',
      'resolved false',
      'parsed 1',
    ],
    correctOrder: [1, 4, 3, 6, 5],
    answerInFull: `start, end, microtask, resolved false, parsed 0.

Two separate ideas, and the question is built so that each one has a line in the output.

The first is ordinary event loop behaviour. The synchronous code runs to completion, so start and end print before anything queued. The microtask queued with queueMicrotask drains at the end of that task, long before the network has answered. Anything waiting on a network response is in a later task entirely.

The second is the one this topic is about. The server answered, so the fetch promise fulfils. It fulfils with a Response whose ok is false and whose status is 404, which is why the line reads resolved false rather than caught. A 404 is an answer, and fetch only rejects when there was no answer at all.

Then the body is read. It parses cleanly, because the server sent valid JSON, and the array is empty, so the length is 0. The catch never runs, and that is the whole point of the question: nothing in this chain treats the 404 as a failure, so a caller with no ok check quietly renders an empty list for a missing resource.

The realistic version is worse. Most servers answer a 500 with an HTML error page, so the json call rejects and the catch does run, with a SyntaxError about an unexpected token. The error mentions parsing and never mentions the status.`,
    hints: ['Which of these lines needs the network to have answered?'],
    tags: ['fetch', 'event-loop'],
  },
  {
    id: 'clone-before-read-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'The request succeeds and returns valid JSON. What does this print?',
    code: `const response = await fetch(url)

const text = await response.text()
console.log('logged', text.length > 0)

const data = await response.json()
console.log('parsed', data)`,
    options: [
      'It logs true, then logs the parsed object. text and json read the same buffered body independently',
      'It logs true, then the json call rejects with a TypeError about the body stream already having been read, so the second log never runs',
      'It logs true, then logs undefined, because json on a drained body resolves with undefined rather than throwing',
      'The text call throws, because reading a JSON response as text is a content type mismatch',
    ],
    correctOption: 1,
    answerInFull: `It logs true, and then the json call rejects with a TypeError. The second log never runs, and in an async function with no try block the rejection propagates out.

The body is a stream. text drained it, response.bodyUsed is now true, and there is nothing left for json to read. The failure is loud rather than silent, which is the good outcome; the version of this bug that hurts is when the two reads are in different files.

The fix depends on which shape you are in.

If you own both reads, do one. Read once and use the value:

    const text = await response.text()
    console.log('logged', text.length > 0)
    const data = JSON.parse(text)

If the reads are in separate layers, a logging interceptor and a caller, clone before either of them reads:

    const forLogging = response.clone()
    log(await forLogging.text())
    return response.json()

clone has to happen before the body has been touched. Called afterwards it throws, for the same reason: there is nothing left to give the second reader. And it buffers, so a clone of a large response costs memory that a single read does not.`,
    explanation: `Independent reads over a buffered body is how a plain object would behave, and it is what libraries that pre-read the body give you. fetch hands you the stream instead.

json does not resolve with undefined. It rejects, which is what makes this findable at all.

There is no content type check on any of the read methods. You can read an image as text and get nonsense.`,
    hints: ['What is bodyUsed after the first read?'],
    tags: ['fetch', 'streams'],
  },
  {
    id: 'abort-error-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'The request would take two seconds. What does this print?',
    code: `const controller = new AbortController()
setTimeout(() => controller.abort(), 100)

try {
  const response = await fetch(url, { signal: controller.signal })
  console.log('ok', response.status)
} catch (error) {
  console.log(error.name, error instanceof Error)
}`,
    options: [
      'AbortError true, because an aborted fetch rejects with a DOMException whose name is AbortError, and DOMException inherits from Error',
      'ok 0, because aborting resolves the fetch with an empty response whose status is 0',
      'TypeError true, because an abort is reported as a network failure and every network failure from fetch is a TypeError',
      'Nothing at all, because aborting settles neither branch and the await never resumes',
    ],
    correctOption: 0,
    answerInFull: `AbortError true.

An aborted fetch rejects with a DOMException whose name is "AbortError". Two details in that sentence do work.

It rejects rather than resolving. Cancellation is not a response, so there is nothing for it to fulfil with.

And the thing to check is the name, not the type. DOMException does inherit from Error, so instanceof Error is true, but it is not a TypeError and it is not any class you can import and compare against. Every cancellation check in real code looks like this:

    catch (error) {
      if (error.name === 'AbortError') return   // we cancelled it, on purpose
      showError(error)
    }

That early return is the part people leave out, and leaving it out is why cancelling a request shows the user an error message about their own navigation.

Two things worth knowing beside it. fetch has no timeout of its own, so a timeout is this same mechanism with a timer, and there is a built-in for it: AbortSignal.timeout(5000). When you need both a deadline and manual cancellation, AbortSignal.any combines the two signals.

And the same signal option works on addEventListener, so one controller per component can cancel its requests and remove its listeners in a single abort call.`,
    explanation: `A status of 0 is a real thing, and it belongs to an opaque cross-origin response, not to an abort. An abort never produces a Response at all.

TypeError is what a genuine network failure rejects with, which is why the name check matters: the two cases have to be told apart and both arrive in the same catch.

The await does resume, by throwing. A signal that never settled anything would be a hang, which is precisely what abort exists to prevent.`,
    hints: ['Is a cancellation a kind of response?'],
    tags: ['fetch', 'abort'],
  },
  {
    id: 'try-catch-status-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'When the API is healthy this works. When it returns a 500 with an HTML error page, users see "Unexpected token < in JSON at position 0" and the logs never mention the status. Why?',
    code: `try {
  const data = await fetch(url).then((r) => r.json())
  render(data)
} catch (error) {
  showError(error.message)
}`,
    options: [
      'Because the arrow function swallows the response, so the catch only ever sees errors from render rather than from the request',
      'Because fetch fulfils for a 500, so the code goes straight on to parse an HTML page as JSON, and the only error raised is the parse failure',
      'Because a 500 response has no body, so json is called on an empty stream and reports the failure at position 0',
      'Because the error from fetch is a DOMException rather than an Error, so its message property is not the one being read',
    ],
    correctOption: 1,
    answerInFull: `Because nothing in this code ever looks at the status.

fetch fulfils for a 500, since the server answered. The chain goes straight on to r.json(), which is handed an HTML error page and rejects with a SyntaxError about an unexpected angle bracket. That is the only error anything sees, so it is the one that reaches the user and the logs. The status, which is the single most useful fact about what went wrong, is on a Response object nobody kept.

Two things are wrong and they are worth separating.

The missing ok check is the bug. Fix it in a wrapper, not at the call site, because the call site is where it gets forgotten:

    async function getJson(url, options) {
      const response = await fetch(url, options)
      if (!response.ok) {
        const detail = await response.text()
        throw new HttpError(response.status, detail)
      }
      return response.json()
    }

Now the failure carries the status and the server's message, error handling can branch on 401 against 500, and retry logic has something to decide with.

The second problem is showing a raw error message to the user. Parse failures, network failures and application errors all end up in one catch and all get rendered. Users get told about JSON syntax, and the actual detail is only useful in the log. Map the error to a message rather than displaying it.

This is also the reason to be able to state fetch's rejection rule in an interview: the design puts the check on you, so the missing check has a recognisable symptom, and this SyntaxError is it.`,
    explanation: `The arrow function is fine. It returns the promise from json, so the chain and the catch both work exactly as written.

A 500 usually has plenty of body, and that is the problem: it is an HTML page rather than JSON. An empty body would fail too, and with a different message.

A DOMException would still have a message. The error here is a SyntaxError, and its message is exactly what the user is seeing.`,
    hints: ['What did fetch do with the 500 before json was ever called?'],
    tags: ['fetch', 'errors'],
  },
  {
    id: 'waterfall-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Loading a dashboard of eight independent panels takes about four seconds, and each individual request takes about 500 milliseconds. What is wrong, and what is the smallest correct fix?',
    code: `const panels = []
for (const id of panelIds) {
  const response = await fetch('/api/panels/' + id)
  panels.push(await response.json())
}`,
    options: [
      'The requests are serialised by the await, so each one waits for the previous. Start them all and await the results together with Promise.all',
      'The browser limits concurrent connections to one per origin, so the requests would queue however they were written. The fix is to batch them into a single endpoint',
      'Pushing to an array inside an async loop forces a synchronous flush per iteration. Collect the promises and flatten them afterwards',
      'Each await yields to the event loop, and the delay is the scheduling overhead of eight turns rather than the requests themselves',
    ],
    correctOption: 0,
    answerInFull: `It is a waterfall. await means "stop here until this settles", so request two is not sent until response one has been fully read. Eight requests at 500 milliseconds each, one after another, is four seconds.

The panels do not depend on each other, so nothing needs to be in order:

    const panels = await Promise.all(
      panelIds.map(async (id) => {
        const response = await fetch('/api/panels/' + id)
        if (!response.ok) throw new HttpError(response.status)
        return response.json()
      }),
    )

Now all eight go out together and the total is roughly the slowest one, about 500 milliseconds. The map runs synchronously and returns eight already-started promises; the await is on the combination rather than on each.

Two things to say about this in an interview, because "use Promise.all" on its own is the shallow answer.

Promise.all rejects as soon as any one of them rejects, so one dead panel means no dashboard. For independent panels, Promise.allSettled is the right combinator, and each panel renders its own error state. Choosing between them is the interesting part of the question.

And a waterfall is sometimes correct. If panel two needs an id from panel one, the sequence is the dependency and there is nothing to parallelise. The bug is only a bug when the sequence was accidental, and it usually is: await in a for loop is the natural thing to type.

The other detail worth knowing: browsers do limit concurrent connections per origin, around six for HTTP/1.1, so eight requests are not perfectly simultaneous. Over HTTP/2 they share one connection and the limit mostly goes away. Either way it is nothing like the serialisation the await creates.`,
    explanation: `The connection limit is real and is not what is happening. Six at a time then two more is not four seconds, and it would not scale linearly with the count.

There is no flush on pushing to an array. The array is ordinary, and the loop body is ordinary code between two awaits.

Scheduling overhead is microseconds. Four seconds for eight iterations is half a second each, which is the request time, and that is the clue that the requests are not overlapping.`,
    hints: ['When is the second request sent?'],
    tags: ['fetch', 'async'],
  },
  {
    id: 'formdata-content-type-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'An upload of a file and two text fields has to go to an endpoint that expects multipart form data. Which request is correct?',
    options: [
      'Build a FormData, set headers to Content-Type multipart/form-data, and pass the FormData as the body',
      'Build a FormData, set no Content-Type header at all, and pass the FormData as the body',
      'Build a plain object, JSON.stringify it with the file included, and set Content-Type to application/json',
      'Build a FormData and pass it through URLSearchParams first, so the fields are encoded before they are sent',
    ],
    correctOption: 1,
    answerInFull: `Pass the FormData and set no Content-Type at all.

The reason is specific and worth knowing rather than memorising. A multipart body is a sequence of parts separated by a boundary string, and the boundary has to appear in the Content-Type header so the server knows what to split on. The browser generates that boundary when it serialises the FormData, and it writes the matching header for you. A header you set by hand replaces the one it would have generated, so the server receives a content type with no boundary in it and cannot parse a body that is otherwise perfectly correct.

    const form = new FormData()
    form.append('file', fileInput.files[0])
    form.append('title', title)
    await fetch('/upload', { method: 'POST', body: form })

The symptom is unhelpful in a memorable way: the request goes out, the server answers 400 or 500, and the message is about a missing boundary or an empty body. Nothing points at the header you added.

The general rule behind it: for a body type the browser understands, which is FormData, URLSearchParams and Blob, let it set the content type. For a string, which is what JSON is, you set it yourself because a string could be anything.

JSON is the wrong shape here for a separate reason. A File is not serialisable, so stringify produces an empty object for it, and sending a file as base64 inside JSON inflates it by a third and needs decoding on the other end. It is a real technique for small payloads and it is not what an endpoint expecting multipart wants.`,
    explanation: `Setting the content type by hand is the natural thing to do after writing the JSON version a hundred times, and it is the one case where copying that habit breaks the request.

Stringifying a file gives you an empty object. FormData exists precisely because JSON has no representation for binary.

URLSearchParams encodes as application/x-www-form-urlencoded, which is a different format with no support for files at all.`,
    hints: ['What has to be in the Content-Type header that only the browser knows?'],
    tags: ['fetch', 'forms'],
  },
  {
    id: 'search-race-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A search box fires a request per keystroke and occasionally shows results for a query the user typed several keystrokes ago. Which fix addresses the cause, and why is it better than the alternative?',
    options: [
      'Debounce the input by 300 milliseconds, so a request is only sent once the user stops typing and there is never more than one in flight',
      'Keep an AbortController per search, abort the previous one before starting the next, and treat an AbortError as a cancellation rather than an error',
      'Await each request before sending the next, so responses can only arrive in the order they were requested',
      'Sort the responses by the query length they were made for, and render only the longest, since that is the most recent',
    ],
    correctOption: 1,
    answerInFull: `Abort the previous request, and ignore the resulting AbortError.

The cause is that responses arrive in whatever order the network decides, so a slow response to "ca" can land after a fast response to "cat" and overwrite it. Nothing is wrong with any individual request, which is what makes this hard to see in a log.

    let controller
    async function search(query) {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch('/search?q=' + query, { signal: controller.signal })
        render(await response.json())
      } catch (error) {
        if (error.name !== 'AbortError') showError(error)
      }
    }

Now order is decided by which request is current rather than by which response happens to arrive first, and the aborted fetch rejects, so its await never resumes and its render never runs.

The alternative fix is a sequence number: increment a counter per request and discard a response whose number is not the latest. It is correct, and it is worse, because the request keeps running. The bytes still come down, the server still does the work, and on a phone that is battery and data spent on a result that will be thrown away. Abort tells the other end to stop.

Debouncing is worth doing as well and does not fix this. It reduces how many requests you send; it does not order the ones you do send. Two requests 300 milliseconds apart can still come back in the wrong order, and the bug becomes rarer, which is worse than obvious.

The general principle to state: when the same logical operation can be in flight more than once, you need a rule for which result wins, and cancellation is the cheapest such rule.`,
    explanation: `Debounce and abort solve different problems and the pair is what you actually ship. On its own, debounce makes a race intermittent.

Serialising the requests does order them and makes the search feel broken: every keystroke now waits for the previous request to finish, so the results lag the typing by the full round trip.

Sorting by query length assumes the user only ever adds characters. Delete one and the rule picks the stale result on purpose.`,
    hints: ['What is still happening on the network after the user has typed the next character?'],
    tags: ['fetch', 'abort', 'race'],
  },
  {
    id: 'cors-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A GET request to a partner API works. Adding an Authorization header makes it fail with a CORS error, and the browser shows a failed OPTIONS request that was never in your code. The partner insists nothing changed on their side. What do you tell them?',
    options: [
      'The Authorization header moved the request out of the simple category, so the browser now sends a preflight OPTIONS first. Their server has to answer it and allow that header, which it has never had to do before',
      'The Authorization header made the request credentialed, so the browser now requires cookies to be allowed. They need to add Access-Control-Allow-Credentials and stop using a wildcard origin',
      'The browser cannot send an Authorization header cross-origin at all. The token has to move into a query parameter or into the request body',
      'The OPTIONS request comes from a proxy or an extension rather than from the browser, since fetch never sends a request the code did not ask for',
    ],
    correctOption: 0,
    answerInFull: `The request stopped being simple, so the browser started asking permission first, and their server has never been asked before.

The rule is that a request a plain HTML form could have made is sent straight out: GET, HEAD or POST, a short list of allowed headers, and a content type of text/plain, form-urlencoded or multipart. Anything outside that is preflighted, which means the browser sends an OPTIONS request to the same URL first, carrying Access-Control-Request-Method and Access-Control-Request-Headers, and only sends the real request if the answer allows them.

Authorization is not on the safe list, so adding it moved the request into the preflighted category. Their server now has to answer OPTIONS with a 2xx, an Access-Control-Allow-Origin naming your origin, and an Access-Control-Allow-Headers that includes Authorization. Most servers answer OPTIONS with a 404 or a 405 by default, which is exactly what a partner who has never been preflighted will have.

They are also right that nothing changed on their side, and that is the useful thing to say. The change is on yours, and the effect is on a request they have never received.

Three things worth adding, because they come up in the same conversation.

The failure is not the server refusing. The OPTIONS request reaches them and is handled; what fails is the browser refusing to send the real request afterwards. CORS is enforced in the browser, and it is a relaxation of the same-origin policy rather than a security feature of its own. The policy exists because the browser attaches the user's cookies to requests, and without it any page could read your email by asking for it.

The error is deliberately uninformative, because the response is opaque by design. Read the network panel rather than the console message, and look at the OPTIONS exchange rather than at the failed request.

And Access-Control-Max-Age is worth mentioning to them, because without it every request pays for a preflight.

The pragmatic fallback if they will not change anything: proxy through your own server. A request from a server has no browser in it, so none of this applies.`,
    explanation: `Credentials are a separate mechanism entirely. An Authorization header is not a credential in the CORS sense; that word means cookies and TLS client certificates, and it is turned on with credentials: include.

The Authorization header is perfectly sendable cross-origin. It just needs a preflight to allow it, which is the whole answer.

fetch genuinely does send a request the code did not ask for. That is what a preflight is, and recognising the OPTIONS request as the browser's own is most of the diagnosis.`,
    hints: ['What made a request that needed no permission into one that does?'],
    tags: ['fetch', 'cors'],
  },
  {
    id: 'resilient-fetch-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'Design the function every request in your app goes through. What does it handle, and what does it deliberately leave to the caller?',
    answerInFull: `The point of a wrapper is that the things everyone forgets happen once instead of at every call site. So the answer is a list of those things, with a reason for each.

What it handles.

The status check. response.ok, and a thrown error carrying the status and the body text, because that is what makes retry and branching possible upstream. This is the whole reason the wrapper exists: hand-written checks are the ones that get forgotten.

A timeout. fetch has none, so every request gets an AbortSignal.timeout, combined with the caller's own signal through AbortSignal.any so cancellation still works. A request with no deadline is a spinner that never stops.

Serialisation and the content type, for the JSON case, and specifically not for FormData, where the browser has to write the multipart boundary itself. That is a one-line rule that is a bug every time it is written by hand.

Retries, but only for the cases where retrying is meaningful: a network failure, a 502, 503 or 504, and a 429 with a Retry-After. With exponential backoff and jitter, and never on a non-idempotent request unless there is an idempotency key. Retrying a POST that timed out is how you charge someone twice.

And a single place for cross-cutting concerns: attaching the auth token, request ids for correlating with server logs, and metrics.

What it leaves alone.

Caching and deduplication. This is where I would stop and hand over to a data layer, React Query or SWR or equivalent, because those need knowledge of keys, staleness and invalidation that a transport does not have. A wrapper that starts caching becomes a bad version of one of those.

Rendering decisions. It throws a typed error; whether a 404 means "empty state" or "something is wrong" is the caller's call, and the two are different in different endpoints of the same API.

Cancellation policy. It accepts a signal and it does not decide when to abort. Whether a keystroke cancels the previous search is a question about the feature.

And 401 handling, which is a judgement call I would flag as one. Silent token refresh inside the wrapper is convenient and hides an important state transition, so I would rather it throw a recognisable AuthError and let one layer above decide between refreshing and sending the user to a login screen.

The shape of the errors matters as much as the list. One error type per meaningful case, HttpError with a status, NetworkError, TimeoutError, and an AbortError passed through unchanged, so the caller can branch on the kind rather than pattern-matching on a message. And an abort is not a failure: it should never reach an error reporter.`,
    hints: [
      'Name the things that are forgotten when written by hand.',
      'Where would you stop, and hand over to a data layer?',
    ],
    tags: ['fetch', 'architecture'],
  },
  {
    id: 'response-is-not-the-body-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'The endpoint returns a JSON array of forty items. This logs undefined and the list renders empty. Nothing throws. Why?',
    code: `async function loadItems() {
  const items = await fetch('/api/items')
  console.log(items.length)
  return items
}`,
    options: [
      'The await resolved before the body had arrived, so a second await on the same promise is needed to get the data',
      'fetch fulfils with a Response, which describes the reply and does not hold it. The body is a second step, await response.json()',
      'The server wraps the array in an envelope, so the count is on items.data.length rather than on items',
      'Reading length on a response is only valid after the status has been checked, so the ok check is what is missing',
    ],
    correctOption: 1,
    answerInFull: `fetch gives you a Response. The data is one more await away.

    const response = await fetch('/api/items')
    if (!response.ok) throw new Error(response.status)
    const items = await response.json()

The split is deliberate. The first promise settles when the status line and the headers arrive, which may be well before any of the body has, and that is what lets you look at the status or the content type and decide whether to read the rest at all. The second promise is the body being read to the end, which is why json, text and blob are all asynchronous.

Nothing throws here because a Response is an ordinary object with no length property, and reading a property that does not exist is undefined rather than an error. So the failure travels: the caller gets a Response where it expected an array, and the complaint surfaces wherever somebody finally tries to iterate it.

Two things make this recognisable in a console. A Response logs as Response with a status and a url on it, not as an array. And an async function that returns it hands the caller a promise of a Response, so the same undefined turns up one layer further out.

Worth pairing with the status check while you are here, because the same wrapper wants both, and a body read without one parses a 500's HTML error page as JSON.`,
    explanation: `Awaiting the same promise twice gives you the same Response again. A settled promise has one value and hands it out to everyone who asks, so there is no second thing to wait for on that promise. The second wait exists, and it is on a different promise, the one response.json() returns.

The envelope answer is the one that sends people to read the API docs for an hour. It is a real shape plenty of APIs use, and it would give you undefined in exactly the same way, which is why the console is the thing to check first: a Response and a wrapped payload do not look remotely alike.

The status check is genuinely missing and it is not the cause. Adding it would change nothing about this log, because the request succeeded.`,
    hints: ['What does the first promise settle with, and when?'],
    tags: ['fetch', 'promises'],
  },
  {
    id: 'post-json-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A new item has to be created by POSTing it as JSON to an endpoint that reads a JSON body. Which request is right?',
    options: [
      'method POST, a Content-Type of application/json, and JSON.stringify(item) as the body',
      'method POST and the item object as the body, since fetch serialises an object and sets the type from it',
      'method POST and JSON.stringify(item) as the body, with no headers, so the browser can work the content type out from the string',
      'method POST, JSON.stringify(item) passed as a json option, which fetch reads in place of body',
    ],
    correctOption: 0,
    answerInFull: `Both halves by hand: you serialise, and you say what it is.

    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })

body takes a string, FormData, URLSearchParams, a Blob or a stream. An object is none of those, so it is coerced to a string the ordinary way and the server receives the literal text object Object. No error, a 400 from something further away, and a puzzling half hour.

The content type is separate because the browser cannot infer it. A string is a string; only you know it is JSON. Send it without one and the browser labels it text/plain, and a server whose JSON body parser is conditional on the content type skips it and hands the handler an empty body.

The exception is the one that gets asked about. With FormData you set neither: the browser generates a multipart boundary and writes it into the header itself, so a Content-Type you set by hand replaces the one carrying the boundary and the server cannot parse the body at all. URLSearchParams is similar, and it labels itself as form-urlencoded.

This is also the point at which a request stops being simple and gets preflighted, because application/json is not a content type an HTML form could have sent.`,
    explanation: `Expecting fetch to serialise the object is expecting it to be a client library. Every popular one does exactly that, which is why this is the commonest thing to get wrong on moving off axios, and fetch stays at the transport layer where a body is bytes.

Leaving the headers off is the subtle version, because it looks like it works. The request goes out, the body is correct, and whether anything reads it depends on a server-side check you cannot see from here.

A json option does not exist. It is worth ruling out rather than half remembering, because the second argument silently ignores keys it does not know, so a typo there fails without a word.`,
    hints: ['Two things the browser does for you with FormData and does not do for JSON.'],
    tags: ['fetch', 'requests'],
  },
  {
    id: 'query-encoding-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Searching for R&D budget returns nothing. The server logs a q of "R" and a second parameter it has never heard of, named "D budget". Why?',
    code: `const query = input.value // R&D budget
const response = await fetch('/api/search?q=' + query)`,
    options: [
      'A space is not legal in a URL, so the browser truncated the request at the first one',
      'The value is concatenated into the URL raw, so its & is read as a separator and starts a new parameter. Build the query with URLSearchParams, or run the value through encodeURIComponent',
      'The server is splitting the query string wrongly, since an ampersand inside a value is legal and should be passed through',
      'encodeURI is the missing call. encodeURIComponent is for whole URLs and would escape the slashes in the path',
    ],
    correctOption: 1,
    answerInFull: `The ampersand in the value is doing the job an ampersand does in a query string.

Once concatenated, the URL is /api/search?q=R&D budget, and nothing distinguishes the user's ampersand from a separator you wrote. The server parses two parameters, exactly as asked.

    const url = new URL('/api/search', location.origin)
    url.searchParams.set('q', input.value)
    await fetch(url)

URLSearchParams encodes every value as it goes, so nothing a user types can change the shape of the URL. It also handles repeated keys and the empty string sensibly, which hand-built strings do not.

The one-liner version, for a URL you are assembling by hand:

    fetch('/api/search?q=' + encodeURIComponent(input.value))

The pair to keep straight is encodeURI and encodeURIComponent. encodeURI escapes a whole URL and deliberately leaves the characters that give a URL its structure alone, ampersand, question mark, slash and equals among them, so it does nothing at all about this. encodeURIComponent escapes one piece that is going inside a URL and escapes all of them, which is what a value needs.

The same class of bug reaches further than search boxes. A plus sign in a value is read as a space, and a hash truncates everything after it.`,
    explanation: `Truncation at the space is a reasonable guess and the log rules it out: "D budget" arrived with its space intact. Spaces really are not legal in a URL, and the browser encodes them for you rather than dropping them, which is why this bug hides until a value contains punctuation that means something.

Blaming the server is the answer that costs a day. An ampersand inside a value is legal, and it is legal encoded as %26. Raw, it is a separator by definition, and every parser in every language agrees.

The encodeURI option is the two functions swapped. It is worth being able to state the difference in one line, because reaching for the wrong one produces code that looks defended and is not.`,
    hints: ['Write out the URL string that actually gets requested.'],
    tags: ['fetch', 'urls'],
  },
  {
    id: 'headers-object-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'The server answers with a Content-Type of application/json and a few other headers. What does this print?',
    code: `const response = await fetch('/api/items')

console.log(response.headers['content-type'])
console.log(response.headers.get('Content-Type'))
console.log({ ...response.headers })`,
    options: [
      'application/json, then application/json, then an object holding every header',
      'undefined, then application/json, then an empty object',
      'undefined, then null, because the key was asked for with different capitalisation, then an empty object',
      'undefined, then application/json, then an object holding every header',
    ],
    correctOption: 1,
    answerInFull: `undefined, then application/json, then {}.

response.headers is a Headers object, not a plain one, and the three lines are three consequences of that.

Bracket access looks for an own property called content-type. There is no such property; the header lives inside the object and is reachable only through its methods, so the answer is undefined rather than an error.

get returns it, and the case does not matter. Header names are case-insensitive by definition, and Headers normalises them, so Content-Type, content-type and CONTENT-TYPE are the same key. A missing header gives null.

Spreading gives an empty object because spreading copies enumerable own properties and Headers has none. Everything it holds is behind an internal slot. Iterating is what works, since Headers is iterable:

    Object.fromEntries(response.headers)
    for (const [name, value] of response.headers) console.log(name, value)

has and forEach are there too, and getSetCookie for the one header that legitimately repeats.

The general shape is worth carrying past this API. FormData, URLSearchParams and Headers are all iterable objects with getters rather than plain bags of properties, and all three spread to nothing.`,
    explanation: `Bracket access returning the value is the expectation a JSON response builds, because everything else in a payload is a plain object. The response body is; the response metadata is not.

Case sensitivity is the trap that is not a trap here. It would matter for a plain object, where content-type and Content-Type are two different keys, which is part of why Headers exists.

Expecting the spread to work is the one worth remembering, because it fails silently. No error, an empty object, and a log that says the response had no headers.`,
    hints: [],
    tags: ['fetch', 'headers'],
  },
  {
    id: 'no-default-timeout-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'A request to a struggling service hangs. How long will fetch wait, and how do you make it give up after five seconds?',
    options: [
      'Thirty seconds, and the timeout option in the second argument changes it',
      'As long as the browser is willing to, and nothing in JavaScript can shorten it, so the timeout has to be enforced by the server',
      'It has no timeout of its own and will wait for minutes. Pass a signal, AbortSignal.timeout(5000)',
      'It follows the connection Keep-Alive, and the way to bound it is a Promise.race against a setTimeout, which is what a signal does internally',
    ],
    correctOption: 2,
    answerInFull: `fetch has no timeout. It waits as long as the browser will, which is minutes.

    await fetch(url, { signal: AbortSignal.timeout(5000) })

Cancellation is the mechanism, and a timeout is one use of it. The other is cancelling by hand, with a controller you keep:

    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
    controller.abort()

And when a request needs both, a timeout and a cancel button, AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) takes whichever fires first.

An aborted fetch rejects, which is the part to handle deliberately. The rejection is a DOMException whose name is AbortError, and a timeout gives a TimeoutError, so the check is on name rather than on the type.

    catch (error) {
      if (error.name === 'AbortError') return // we cancelled it on purpose
      showError(error)
    }

A request you cancelled is not a failure and should not put an error in front of the user. That distinction is most of why this comes up in interviews.

The same signal cancels an event listener registration, so a component can hold one controller and tear everything down in one call.`,
    explanation: `A timeout option is the most tempting answer because almost every HTTP client has one, and the second argument to fetch silently ignores keys it does not recognise. Adding it produces code that reads as though it has a timeout and does not.

Leaving it to the server is a real belt to wear and no use as braces. A server timeout does not help when the problem is the network between you and it, which is the case where a request hangs for minutes.

Racing a promise against a timer does bound how long your code waits, and it leaves the request running: the browser keeps the connection, the server keeps working, and nothing tells either to stop. Aborting is better precisely because it does.`,
    hints: [],
    tags: ['fetch', 'cancellation'],
  },
]
