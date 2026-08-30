import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Two defaults, backwards',
    heading: 'Why this matters',
    script: `Fetch looks like the easiest thing in this track and produces the most
      production bugs, because two of its defaults are the opposite of what
      everyone assumes. A failing request does not reject. A response body can
      only be read once. Code written on the assumption that either is untrue
      works perfectly until the server has a bad day.

      The interview version of this topic is rarely how you make a request. It is
      what happens when it fails, and that is a question about error handling,
      about cancellation, and about who enforces the cross origin rules.`,
  },
  {
    title: 'Headers first, body second',
    heading: 'The two promises',
    script: `One request, two separate waits.

      The first promise settles as soon as the browser has the status line and
      the headers. The body may not have started arriving. That is not an
      implementation detail. It is what lets you look at the status, or at a
      content type, and decide whether to bother reading the rest.

      The second promise is the body. Json, text, blob, array buffer and form
      data all read the stream to the end and give you the whole thing, and each
      one is asynchronous because reading is.

      Which means an ordinary successful request has two settlements in it, and
      an ordinary failing one has the failure in a strange place. The server
      answers five hundred. The first promise still fulfils, because a response
      arrived. Then the body of that five hundred is usually an HTML error page,
      so parsing it as JSON rejects, and the failure surfaces one promise later
      than the thing that actually went wrong, mentioning parsing and never
      mentioning the status.`,
  },
  {
    title: 'It rejects only when nobody answered',
    heading: 'When `fetch` does not throw',
    script: `Fetch rejects when there was no response. A DNS failure, a refused
      connection, a dropped network, a request blocked by cross origin rules or
      by an extension, or an abort. That is the whole list.

      It fulfils for every response the server actually sent, including four oh
      four, five hundred and five oh three. Those are answers. The request
      succeeded. You did not like the reply.

      So every fetch needs a status check, and forgetting it is the single most
      common bug in this topic. The ok property is true for any status from two
      hundred to two ninety nine. Write that check once, in a wrapper, rather
      than at every call site, because the version that gets forgotten is always
      the one written by hand.

      The reason for the design is worth being able to give. A promise rejection
      means the operation could not be performed, and asking a server a question
      it answered with no is an operation that was performed. It also keeps the
      layers honest, because HTTP semantics belong to your application, not to
      the transport. Plenty of APIs return a four oh four to mean an empty
      result, and a transport that turned that into an exception would be making
      a decision it cannot make correctly.`,
  },
  {
    title: 'A stream is consumed once',
    heading: 'Reading the body once',
    script: `A response body is a stream, and a stream can be consumed once. Read
      it as text and then try to read it as JSON, and the second call throws,
      because there is nothing left.

      There is a flag for it, body used, and a way around it, clone, which must
      be called before anything has read the body. The clone gives you a second
      reader over the same data, at the cost of buffering it.

      The place this actually bites is error handling, because the useful thing
      to do with a failure is read the body for a message, and the useful thing
      to do with a success is parse it. That works when only one branch reads.
      What does not work is logging the body in an interceptor and then parsing
      it in the caller, which is exactly the shape a logging layer takes. Clone
      in the interceptor, or read once and pass the value on.

      Two more properties worth knowing. The body is a readable stream, so you
      can process a large response as it arrives rather than buffering it, which
      is how progress indicators and streaming responses work. And the headers
      are a Headers object, not a plain object, so it has a get method, it is
      case insensitive, and spreading it gives you nothing.`,
  },
  {
    title: 'No timeout, and one fix for two problems',
    heading: 'Cancelling, and timing out',
    script: `Fetch has no timeout. A request will wait as long as the browser is
      willing to, which is minutes. Both cancellation and timeouts come from the
      same place, which is an abort controller and its signal.

      An aborted fetch rejects with a DOM exception whose name is abort error, so
      the check is on the name rather than on the type. Distinguishing it
      matters, because a cancelled request is not a failure and should not show
      the user an error. For a plain deadline there is a built in signal, abort
      signal timeout, and when you need a deadline and manual cancellation
      together, abort signal any combines them.

      The other job cancellation does is fixing a race, and this is the one to be
      able to describe. A search box fires a request per keystroke. The responses
      come back in whatever order the network decides, so a slow response to c a
      can arrive after the fast response to c a t and overwrite it. The user sees
      results for something they typed two seconds ago, and there is nothing
      wrong with any individual request.

      Abort the previous request at the top of each search and the problem goes
      away, because order is then decided by which request is current rather than
      by which response happens to arrive first.

      The alternative fix is a sequence number: discard a response whose number is
      not the latest. It works, and it leaves the request running, so it wastes
      the network and the server. Aborting is better because it tells the other
      end to stop.`,
  },
  {
    title: 'A relaxation, not a security feature',
    heading: 'Cross-origin, in the only order that makes sense',
    script: `The rule underneath everything: a page may send a request anywhere,
      and it may only read the response from its own origin unless the other
      origin allows it. An origin is scheme, host and port, all three.

      That ordering is the part to get right, because it explains everything
      else. Cross origin resource sharing is a relaxation of a restriction, not a
      security feature. The restriction is the same origin policy, which exists
      because your browser attaches the user's cookies to requests. Without it,
      any page could read your email by asking for it with your session.

      The browser enforces it, not the server. The request usually reaches the
      server and is usually handled. What the browser refuses to do is hand the
      response to your JavaScript. That is why the error tells you almost
      nothing: the response is opaque by design, so the details you would want
      are the details being withheld. And it is why the fix is always on the
      server, and why a proxy works, because a request from your own server has
      no browser in it.

      Some requests are preflighted. A request a plain HTML form could have made
      is sent straight out. Anything else, which includes every put and delete,
      every custom header such as authorization, and a JSON content type, makes
      the browser send an options request first to ask permission. That is why
      adding one header to a working request suddenly produces an error. You
      moved it out of the simple category.

      And credentials tighten the rules. Send cookies cross origin and the server
      may not answer with a wildcard. It has to name your origin exactly, which
      is deliberate, because a wildcard plus credentials would let any site read
      authenticated responses.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked whether fetch throws on a four oh four, say no. It fulfils for
      anything the server answered, and rejects only when there was no response:
      network failure, a cross origin block, or an abort. So every call needs an
      ok check, and you put it in a wrapper.

      Asked how you add a timeout, say fetch has none. Abort signal timeout, or a
      controller you abort yourself, and abort signal any when you need both a
      deadline and manual cancellation.

      Asked why a search box shows results for the wrong query, say responses
      arrive out of order and a late one overwrites a newer one. Abort the
      previous request on each keystroke, which also stops the server working on
      something nobody wants. A sequence number is the fallback when you cannot
      abort.

      Asked what cross origin resource sharing is, say a way for a server to
      relax the same origin policy. The browser enforces it, the request usually
      still happens, and the error is deliberately uninformative. Then mention
      preflight, because that is the follow up.

      Expect a question about why you cannot read a body twice, and answer it
      with the word stream.`,
  },
]
