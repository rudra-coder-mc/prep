import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'live-against-static',
    title: 'Prove the difference between a live and a static collection',
    difficulty: 'medium',
    prompt:
      'Build a small page with a list you can add to and remove from, and write a harness that demonstrates every behaviour that separates an HTMLCollection from a NodeList, with an assertion for each rather than a console log.',
    requirements: [
      'A forward loop over getElementsByClassName that removes matches, asserting that exactly half survive, and the same loop over querySelectorAll asserting that none do.',
      'An assertion that a node removed from the tree is still usable: read a property off it, append it elsewhere, and show that a listener attached before the removal still fires.',
      'A test that childNodes and children disagree on a formatted list and agree on the same markup with the whitespace stripped, with the expected numbers written out.',
      'Show that appending an attached node moves it, and that cloneNode(true) copies attributes but not listeners, with an assertion for each half.',
      'A comment naming the one case where you would deliberately choose the live collection, and what you would have to write instead if it did not exist.',
    ],
  },
  {
    id: 'measure-the-thrash',
    title: 'Make layout thrashing visible, then remove it',
    difficulty: 'hard',
    prompt:
      'Write a benchmark page that renders N boxes and resizes them in two ways, interleaved reads and writes against read-then-write, and report the difference in a way that survives being run on a different machine.',
    requirements: [
      'Both versions produce an identical DOM afterwards, asserted by comparing the resulting heights, so the comparison is between two ways of doing the same work.',
      'The harness runs at several sizes and reports the shape of the curve, not one number, since the point is that one version is superlinear and the other is not.',
      'A run recorded in the browser performance panel, with a note of how many Layout entries each version produced and how you counted them.',
      'A third version that keeps the interleaving but moves the writes into a requestAnimationFrame callback, with a written comparison against the batched one.',
      'A list of every property you found that forces layout when read, discovered by measuring rather than by copying a list, and one that surprised you.',
    ],
  },
]
