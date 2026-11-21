import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectNoHorizontalOverflow, useLanguage } from './helpers'

/** Tap on the phone project (touch), click on desktop. */
function press(isPhone: boolean) {
  return (target: Locator) => (isPhone ? target.tap() : target.click())
}

const LANDING = 'Which pill will you take?'

const RECAP = 'The red pill, in brief'
const PLAN = 'Your plan'

/** Red pill, then Next through all five cards to the recap. */
async function toRecap(page: Page, go: (l: Locator) => Promise<void>) {
  await go(page.getByRole('button', { name: /Red pill/ }))
  for (let n = 1; n <= 5; n++) await go(page.getByRole('button', { name: 'Next' }))
  await expect(page.getByRole('heading', { name: RECAP })).toBeFocused()
}

/** Red pill, through all five cards and the recap, then Start over. */
async function finishRed(page: Page, go: (l: Locator) => Promise<void>) {
  await toRecap(page, go)
  await go(page.getByRole('button', { name: 'Start over' }))
}

/** Open one of a card's closed rows ("What can help?", "Read more", "References (2)"...). */
function row(page: Page, id: 'help' | 'more' | 'why' | 'references') {
  return page.getByTestId(id).locator('summary')
}

/** A sideways swipe across the card, as a finger would make it. */
async function swipe(page: Page, dx: number) {
  await page
    .getByTestId('pill-game')
    .locator('> section')
    .evaluate((el, by) => {
      const touch = (x: number) =>
        new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 })
      const from = 180 - by / 2
      el.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [touch(from)],
          changedTouches: [touch(from)],
        }),
      )
      el.dispatchEvent(
        new TouchEvent('touchend', {
          bubbles: true,
          touches: [],
          changedTouches: [touch(from + by)],
        }),
      )
    }, dx)
}

/** The guide's line after he tosses the blue pill away. */
const SWAP_LINE = /^Nice try! Looking away doesn’t make reality disappear\. Try this one instead\.$/

/** Long enough for the toss and the green pill's landing to finish. */
const SWAP_MS = 2600

/** Blue pill (the guide tosses it and offers green), then take the green pill. */
async function toGreen(page: Page, go: (l: Locator) => Promise<void>) {
  await go(page.getByRole('button', { name: /Blue pill/ }))
  await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
  await go(page.getByRole('button', { name: /Green pill/ }))
}

test('the preview strip is not shown on the pill game', async ({ page }) => {
  await page.goto('/yuvako/activity/pills')
  await expect(page.getByRole('heading', { name: LANDING })).toBeVisible()
  await expect(page.getByTestId('preview-strip')).toHaveCount(0)
  await page.getByRole('button', { name: /Red pill/ }).click()
  await expect(page.getByTestId('preview-strip')).toHaveCount(0)
})

test('the page heading is "Choose your reality", then names the chosen pill', async ({
  page,
}, info) => {
  const go = press(info.project.name === 'phone')
  const h1 = page.getByRole('heading', { level: 1 })
  await page.goto('/yuvako/activity/pills')
  await expect(h1).toHaveText('Choose your reality')

  await go(page.getByRole('button', { name: /Red pill/ }))
  await expect(h1).toHaveText('Red pill')
  await expect(page.getByText('You took the red pill')).toHaveCount(0)
  await go(page.getByRole('button', { name: 'Back' }).first())
  await expect(h1).toHaveText('Choose your reality')

  // The guide tosses the blue pill and offers green: still a choice, so the title stays.
  await go(page.getByRole('button', { name: /Blue pill/ }))
  await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
  await expect(h1).toHaveText('Choose your reality')
  await expect(page.getByText('You took the blue pill')).toHaveCount(0)

  await go(page.getByRole('button', { name: /Green pill/ }))
  await expect(h1).toHaveText('Green pill')
  await expect(page.getByText('You took the green pill')).toHaveCount(0)
})

test('Next and Back open each page at the top, even from the bottom of the page', async ({
  page,
}, info) => {
  const go = press(info.project.name === 'phone')
  const scrollY = () => page.evaluate(() => window.scrollY)
  await page.goto('/yuvako/activity/pills')
  await go(page.getByRole('button', { name: /Red pill/ }))
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  expect(await scrollY()).toBeGreaterThan(0)
  await go(page.getByRole('button', { name: 'Next' }).last())
  await expect(page.getByRole('heading', { name: 'Card 2 of 5' })).toBeVisible()
  await expect.poll(scrollY).toBe(0)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await go(page.getByRole('button', { name: 'Back' }).last())
  await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeVisible()
  await expect.poll(scrollY).toBe(0)
})

test.describe('pill game: red pill', () => {
  test('every card, Back, the recap, and the landing screen again after Start over', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    const game = page.getByTestId('pill-game')
    await expect(page.getByRole('heading', { name: LANDING })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await go(page.getByRole('button', { name: /Red pill/ }))
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeFocused()
    await expect(
      game.getByRole('heading', { level: 3, name: 'Screens can steal sleep' }),
    ).toBeVisible()
    await expect(game.getByRole('group', { name: /four steps/ })).toBeVisible()
    await expect(game.getByTestId('takeaway')).toContainText('Key takeaway')
    // The rest is one tap away.
    await expect(game.getByRole('tab')).toHaveCount(0)
    await go(row(page, 'more'))
    await expect(game.getByRole('tab')).toHaveCount(2)
    await go(row(page, 'references'))
    await expect(game.getByRole('button', { name: /cdc\.gov\/sleep/ })).toBeVisible()
    await go(page.getByRole('button', { name: 'Next' }))
    await expect(page.getByRole('heading', { name: 'Card 2 of 5' })).toBeFocused()
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeVisible()
    // Each card opens with its rows closed again.
    await expect(game.getByRole('tab')).toHaveCount(0)
    for (let n = 1; n < 5; n++) await go(page.getByRole('button', { name: 'Next' }))
    await expect(page.getByRole('heading', { name: 'Card 5 of 5' })).toBeVisible()
    // The last card has Next too: it leads to the recap. There is no Exit.
    await expect(game.getByRole('button', { name: 'Next' })).toHaveCount(1)
    await expect(game.getByRole('button', { name: 'Exit' })).toHaveCount(0)
    await go(game.getByRole('button', { name: 'Next' }))

    // After the last card: the recap, with every card in a line and the green pill on offer.
    await expect(page.getByRole('heading', { name: RECAP })).toBeFocused()
    await expect(game).toHaveAttribute('data-screen', 'redEnd')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Red pill')
    const rows = page.getByTestId('red-recap').getByRole('listitem')
    await expect(rows).toHaveCount(5)
    await expect(rows.nth(0)).toContainText('Screens can steal sleep')
    await expect(rows.nth(0)).toContainText('A screen-free wind-down')
    await expect(page.getByRole('button', { name: 'Take the green pill' })).toBeVisible()
    await expectNoHorizontalOverflow(page)

    // A row opens its card again; Back from the recap opens the last card.
    await go(rows.nth(1).getByRole('button'))
    await expect(page.getByRole('heading', { name: 'Card 2 of 5' })).toBeFocused()
    for (let n = 2; n <= 5; n++) await go(page.getByRole('button', { name: 'Next' }))
    await expect(page.getByRole('heading', { name: RECAP })).toBeFocused()
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: 'Card 5 of 5' })).toBeFocused()
    await go(page.getByRole('button', { name: 'Next' }))

    await go(page.getByRole('button', { name: 'Start over' }))
    await expect(page.getByRole('heading', { name: LANDING })).toBeFocused()
    await expect(game).toHaveAttribute('data-screen', 'start')
    await expect(page.getByRole('button', { name: /Red pill/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Blue pill/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Green pill/ })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test('the recap hands over the green pill, and Back from the first solution returns to it', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await toRecap(page, go)
    await go(page.getByRole('button', { name: 'Take the green pill' }))
    await expect(page.getByRole('heading', { name: 'Solution 1 of 3' })).toBeFocused()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Green pill')
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: RECAP })).toBeFocused()
    // The guide's "Nice try!" line belongs to the blue pill only.
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toHaveCount(0)
  })

  test('the red pill can be replayed, and the blue pill chosen, after finishing', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await finishRed(page, go)
    await go(page.getByRole('button', { name: /Red pill/ }))
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeFocused()
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: LANDING })).toBeFocused()
    await finishRed(page, go)
    await go(page.getByRole('button', { name: /Blue pill/ }))
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
  })

  test('plays the whole red flow by keyboard, through the recap to the green pill', async ({
    page,
  }) => {
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Red pill/ }).focus()
    await page.keyboard.press('Enter')
    for (let n = 1; n <= 5; n++) {
      await expect(page.getByRole('heading', { name: `Card ${n} of 5` })).toBeFocused()
      await page.getByRole('button', { name: 'Next' }).focus()
      await page.keyboard.press('Enter')
    }
    await expect(page.getByRole('heading', { name: RECAP })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('red-recap').getByRole('button').first()).toBeFocused()
    for (let n = 0; n < 5; n++) await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Take the green pill' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Solution 1 of 3' })).toBeFocused()
  })

  test('Back and Next are in one bar that stays at the bottom of the screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Red pill/ }).click()
    const next = page.getByRole('button', { name: 'Next' })
    const back = page.getByRole('button', { name: 'Back' })
    await expect(next).toHaveCount(1)
    await expect(back).toHaveCount(1)
    // On screen before any scrolling, with the card longer than the screen...
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(740)
    await expect(next).toBeInViewport({ ratio: 1 })
    await expect(back).toBeInViewport({ ratio: 1 })
    // ...and still there at the end of the card.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(next).toBeInViewport({ ratio: 1 })
    await next.click()
    await expect(page.getByRole('heading', { name: 'Card 2 of 5' })).toBeFocused()
    await back.click()
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeFocused()
  })

  test('a sideways swipe turns the card; an up-and-down one does not', async ({ page }) => {
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Red pill/ }).click()
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeFocused()
    await swipe(page, -120)
    await expect(page.getByRole('heading', { name: 'Card 2 of 5' })).toBeFocused()
    await swipe(page, 120)
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeFocused()
    // Too short to be a swipe.
    await swipe(page, -40)
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeVisible()
  })

  test('the timeline shows one step at a time', async ({ page }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await go(page.getByRole('button', { name: /Red pill/ }))
    const diagram = page.getByRole('group', { name: /four steps/ })
    const steps = diagram.getByRole('listitem')
    const then = diagram.getByRole('button', { name: 'Then what?' })
    await expect(steps).toHaveCount(1)
    await expect(steps.first()).toContainText('Screen use late at night')
    await expect(diagram.getByText('Tired the next day', { exact: true })).toBeHidden()
    const before = (await diagram.boundingBox())!
    await go(then)
    await expect(steps).toHaveCount(2)
    await expect(diagram.getByText('Harder to wind down', { exact: true })).toBeVisible()
    await go(then)
    await go(then)
    await expect(steps).toHaveCount(4)
    await expect(diagram.getByText('Tired the next day', { exact: true })).toBeVisible()
    // The diagram keeps its size, so the button stays under the finger.
    expect((await diagram.boundingBox())!.height).toBeCloseTo(before.height, 0)
    // At the end the same button starts it again.
    await expect(then).toHaveCount(0)
    await go(diagram.getByRole('button', { name: 'Show again' }))
    await expect(steps).toHaveCount(1)
  })

  test('"Often" and "Try instead" switch between the habit and the swap', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await go(page.getByRole('button', { name: /Red pill/ }))
    await go(page.getByRole('button', { name: 'Next' }))
    const often = page.getByRole('button', { name: 'Often' })
    const instead = page.getByRole('button', { name: 'Try instead' })
    await expect(often).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Many things at once')).toBeVisible()
    await expect(page.getByText('One thing at a time', { exact: true })).toBeHidden()
    await go(instead)
    await expect(instead).toHaveAttribute('aria-pressed', 'true')
    await expect(often).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('One thing at a time', { exact: true })).toBeVisible()
    await expect(page.getByText('Many things at once')).toBeHidden()
  })

  test('age tabs work by keyboard and show each group', async ({ page }) => {
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Red pill/ }).click()
    await row(page, 'more').click()
    const tabs = page.getByRole('tab')
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText('American Academy of Pediatrics')
    await tabs.nth(0).focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toContainText('CDC advises')
    await expect(page.getByRole('tabpanel')).toContainText('[2]')
    await page.keyboard.press('End')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowRight') // wraps round to the first tab
    await expect(tabs.nth(0)).toBeFocused()
    await page.keyboard.press('ArrowLeft') // and back to the last
    await expect(tabs.nth(1)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(tabs.nth(0)).toBeFocused()
    // Only the selected tab is in the tab order.
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1')
  })

  test('the closed rows open by keyboard', async ({ page }) => {
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Red pill/ }).click()
    const help = page.getByTestId('help')
    await expect(help.getByText(/screen-off time/)).toBeHidden()
    await row(page, 'help').focus()
    await page.keyboard.press('Enter')
    await expect(help.getByText(/screen-off time/)).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(help.getByText(/screen-off time/)).toBeHidden()
  })

  test('every red card has a title, a visual, a takeaway, help and a linked source; 360px has no overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Red pill/ }).click()
    for (let n = 1; n <= 5; n++) {
      await expect(page.getByRole('heading', { name: `Card ${n} of 5` })).toBeVisible()
      const game = page.getByTestId('pill-game')
      await expect(game.getByRole('heading', { level: 3 })).toBeVisible()
      await expect(game.locator('figure')).toHaveCount(1)
      await expect(game.getByTestId('takeaway')).toContainText('Key takeaway')
      await expectNoHorizontalOverflow(page)
      // Everything else is there once its row is opened.
      await expect(row(page, 'help')).toHaveText('What can help?')
      for (const id of ['help', 'more', 'references'] as const) await row(page, id).click()
      await expect(game.getByTestId('help').locator('p')).toBeVisible()
      await expect(game.getByRole('tab')).toHaveCount(2)
      await expect(game.getByRole('listitem').filter({ hasText: '[1]' }).first()).toBeVisible()
      expect(await game.getByTestId('references').getByRole('button').count()).toBeGreaterThan(0)
      await expectNoHorizontalOverflow(page)
      if (n < 5) await page.getByRole('button', { name: 'Next' }).click()
    }
  })

  test('works in Gujarati', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'ગુજરાતી' }).click()
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /લાલ ગોળી/ }).click()
    await expect(page.getByRole('heading', { name: 'કાર્ડ 1 / 5' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: 'સ્ક્રીન ઊંઘ છીનવી શકે છે' })).toBeVisible()
    await page.getByRole('button', { name: 'પછી શું?' }).click()
    await row(page, 'more').click()
    await expect(page.getByRole('tab', { name: 'બાળકો' })).toBeVisible()
    await expect(row(page, 'references')).toHaveText('સંદર્ભો (2)')
    await expectNoHorizontalOverflow(page)
    for (let n = 1; n <= 5; n++) await page.getByRole('button', { name: 'આગળ' }).click()
    await expect(page.getByRole('heading', { name: 'લાલ ગોળી, ટૂંકમાં' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'લીલી ગોળી લો' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

test.describe('pill game: blue pill', () => {
  test('the guide tosses the blue pill away and offers a green one, on the same screen', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    const game = page.getByTestId('pill-game')
    const guide = page.getByTestId('pill-guide')
    await expect(guide).toHaveAttribute('data-offer', 'blue')
    await go(page.getByRole('button', { name: /Blue pill/ }))

    // His line replaces the question and is read out first.
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
    await expect(page.getByRole('heading', { name: LANDING })).toHaveCount(0)
    await expect(game).toHaveAttribute('data-screen', 'blueSwap')
    await expect(guide).toHaveAttribute('data-offer', 'green')
    // No blackout and no separate "no escape" screen any more.
    await expect(page.locator('dialog')).toHaveCount(0)

    // The blue pill is gone; the red one stays and the green one is offered instead.
    await expect(game.getByRole('button', { name: /Blue pill/ })).toHaveCount(0)
    await expect(game.getByRole('button', { name: /Red pill/ })).toBeVisible()
    await expect(game.getByRole('button', { name: /Green pill/ })).toBeVisible()
    // No way back to the blue pill from here.
    await expect(game.getByRole('button', { name: 'Start over' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await page.waitForTimeout(SWAP_MS)
    await expectNoHorizontalOverflow(page)

    await go(page.getByRole('button', { name: /Green pill/ }))
    await expect(page.getByRole('heading', { name: 'Solution 1 of 3' })).toBeFocused()
  })

  test('the red pill can still be taken after the blue one is tossed', async ({ page }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await go(page.getByRole('button', { name: /Blue pill/ }))
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
    await go(page.getByRole('button', { name: /Red pill/ }))
    await expect(page.getByRole('heading', { name: 'Card 1 of 5' })).toBeFocused()
  })

  test('the pills in his hands are the buttons, labelled on hover or focus', async ({ page }) => {
    await page.goto('/yuvako/activity/pills')
    const guide = page.getByTestId('pill-guide')
    const red = page.getByRole('button', { name: /Red pill/ })
    const blue = page.getByRole('button', { name: /Blue pill/ })
    const tip = (button: Locator) => button.locator('span').first()

    // Each button sits on the palm holding that pill (44 and 276 across the
    // 320-wide drawing, 153 down its 222), and is big enough to tap.
    const art = (await guide.boundingBox())!
    for (const [button, x] of [
      [red, 44],
      [blue, 276],
    ] as const) {
      const b = (await button.boundingBox())!
      expect(Math.abs(b.x + b.width / 2 - (art.x + (art.width * x) / 320))).toBeLessThan(3)
      expect(Math.abs(b.y + b.height / 2 - (art.y + (art.height * 153) / 222))).toBeLessThan(3)
      expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44)
    }

    if (await page.evaluate(() => matchMedia('(hover: none)').matches)) {
      // A touch screen cannot hover, so both labels are always out, side by side.
      await expect(tip(red)).toHaveCSS('opacity', '1')
      await expect(tip(blue)).toHaveCSS('opacity', '1')
      const r = (await tip(red).boundingBox())!
      const b = (await tip(blue).boundingBox())!
      expect(r.x + r.width).toBeLessThan(b.x)
    } else {
      await expect(tip(red)).toHaveCSS('opacity', '0')
      await expect(tip(blue)).toHaveCSS('opacity', '0')
      await red.hover()
      await expect(tip(red)).toHaveCSS('opacity', '1')
      await expect(guide).toHaveAttribute('data-lean', 'left')
      await page.mouse.move(0, 0)
      await expect(tip(red)).toHaveCSS('opacity', '0')
      // From the keyboard too.
      await red.focus()
      await page.keyboard.press('Tab')
      await expect(blue).toBeFocused()
      await expect(tip(blue)).toHaveCSS('opacity', '1')
      await expect(guide).toHaveAttribute('data-lean', 'right')
    }
    await expectNoHorizontalOverflow(page)
  })

  test('with reduced motion the guide is shown still, holding the green pill', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Blue pill/ }).click()
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
    const guide = page.getByTestId('pill-guide')
    await expect(guide).toHaveAttribute('data-offer', 'green')
    expect(await guide.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0)
    await context.close()
  })
})

test.describe('pill game: green pill', () => {
  test('three pages with progress, Back and Next, then the plan and Start over', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    const game = page.getByTestId('pill-game')
    await toGreen(page, go)
    await expect(page.getByRole('heading', { name: 'Solution 1 of 3' })).toBeFocused()
    await expect(
      game.getByRole('heading', { level: 3, name: 'Reconnect with people' }),
    ).toBeVisible()
    await expect(game.getByTestId('action')).toContainText('What you can do')
    await expect(row(page, 'why')).toHaveText('Why it helps')
    // The study and its careful wording are under "Why it helps".
    await expect(game.getByText(/Adult Development/)).toBeHidden()
    await go(row(page, 'why'))
    await expect(game.getByText(/Adult Development/)).toBeVisible()
    await expect(game).toContainText(
      'strongly associated with better happiness, health and longevity',
    )
    await go(row(page, 'references'))
    await expect(game.getByRole('button', { name: /news\.[a-z]+\.edu/ })).toBeVisible()
    await expect(game.getByRole('button', { name: 'Exit' })).toHaveCount(0)
    await expectNoHorizontalOverflow(page)

    await go(page.getByRole('button', { name: 'Next' }))
    await expect(page.getByRole('heading', { name: 'Solution 2 of 3' })).toBeFocused()
    await expect(
      game.getByRole('heading', { level: 3, name: 'Create healthier digital boundaries' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: 'Solution 1 of 3' })).toBeFocused()
    await go(page.getByRole('button', { name: 'Next' }))
    await go(page.getByRole('button', { name: 'Next' }))

    // Last page: Next leads to the plan, and it stays on the site.
    await expect(page.getByRole('heading', { name: 'Solution 3 of 3' })).toBeFocused()
    await expect(
      game.getByRole('heading', { level: 3, name: 'Move, rest and be present' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    const popups: Page[] = []
    page.on('popup', (p) => popups.push(p))
    await go(game.getByRole('button', { name: 'Next' }))
    await expect(page.getByRole('heading', { name: PLAN })).toBeFocused()
    await expect(game).toHaveAttribute('data-screen', 'greenEnd')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Green pill')
    await expect(page.getByTestId('green-plan').getByRole('listitem')).toHaveCount(3)
    await expectNoHorizontalOverflow(page)
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: 'Solution 3 of 3' })).toBeFocused()
    await go(game.getByRole('button', { name: 'Next' }))

    await go(page.getByRole('button', { name: 'Start over' }))
    await expect(page.getByRole('heading', { name: LANDING })).toBeFocused()
    await expect(game).toHaveAttribute('data-screen', 'start')
    await expect(page.getByRole('button', { name: /Red pill/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Blue pill/ })).toBeVisible()
    expect(popups).toEqual([])
    expect(new URL(page.url()).pathname).toBe('/yuvako/activity/pills')
  })

  test('"I’ll try this" puts a solution on the plan, where it can be changed; Start over clears it', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await toGreen(page, go)
    const tryThis = page.getByRole('button', { name: 'I’ll try this' })
    await expect(tryThis).toHaveAttribute('aria-pressed', 'false')
    await go(tryThis)
    await expect(tryThis).toHaveAttribute('aria-pressed', 'true')
    // It is remembered when the page is left and opened again.
    await go(page.getByRole('button', { name: 'Next' }))
    await expect(tryThis).toHaveAttribute('aria-pressed', 'false')
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(tryThis).toHaveAttribute('aria-pressed', 'true')
    for (let n = 1; n <= 3; n++) await go(page.getByRole('button', { name: 'Next' }))

    const plan = page.getByTestId('green-plan')
    const rows = plan.getByRole('button', { pressed: true })
    await expect(plan).toContainText('Here is what you chose to try.')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText('Reconnect with people')
    // The plan has no reference list, so it shows no [1] markers.
    await expect(plan.getByRole('list')).not.toContainText('[')
    await go(plan.getByRole('button', { name: /Move, rest and be present/ }))
    await expect(rows).toHaveCount(2)
    await go(plan.getByRole('button', { name: /Reconnect with people/ }))
    await go(plan.getByRole('button', { name: /Move, rest and be present/ }))
    await expect(rows).toHaveCount(0)
    await expect(plan).toContainText('Pick one to try this week.')

    await go(plan.getByRole('button', { name: /Reconnect with people/ }))
    await go(page.getByRole('button', { name: 'Start over' }))
    await toGreen(page, go)
    await expect(tryThis).toHaveAttribute('aria-pressed', 'false')
  })

  test('the plan opens with a short burst of fireworks, and none with reduced motion', async ({
    page,
    browser,
  }) => {
    await page.goto('/yuvako/activity/pills')
    await toGreen(page, (l) => l.click())
    for (let n = 1; n <= 3; n++) await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: PLAN })).toBeFocused()
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('canvas')).toHaveCount(0, { timeout: 15_000 })

    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const still = await context.newPage()
    await still.goto('/yuvako/activity/pills')
    await toGreen(still, (l) => l.click())
    for (let n = 1; n <= 3; n++) await still.getByRole('button', { name: 'Next' }).click()
    await expect(still.getByRole('heading', { name: PLAN })).toBeFocused()
    await expect(still.locator('canvas')).toHaveCount(0)
    await context.close()
  })

  test('Back from the first green page returns to the guide offering the green pill', async ({
    page,
  }, info) => {
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await toGreen(page, go)
    await go(page.getByRole('button', { name: 'Back' }))
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
    await expect(page.getByTestId('pill-guide')).toHaveAttribute('data-offer', 'green')
    await expect(page.getByRole('button', { name: /Green pill/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Blue pill/ })).toHaveCount(0)
  })

  test('Start over works from the first and last green pages', async ({ page }, info) => {
    test.setTimeout(60_000)
    const go = press(info.project.name === 'phone')
    await page.goto('/yuvako/activity/pills')
    await toGreen(page, go)
    await expect(page.getByRole('heading', { name: 'Solution 1 of 3' })).toBeVisible()
    await go(page.getByRole('button', { name: 'Start over' }))
    await expect(page.getByRole('heading', { name: LANDING })).toBeFocused()

    await toGreen(page, go)
    await go(page.getByRole('button', { name: 'Next' }).first())
    await go(page.getByRole('button', { name: 'Next' }).first())
    await expect(page.getByRole('heading', { name: 'Solution 3 of 3' })).toBeVisible()
    await go(page.getByRole('button', { name: 'Start over' }))
    await expect(page.getByRole('heading', { name: LANDING })).toBeFocused()
  })

  test('plays blue, the swap and green by keyboard', async ({ page }) => {
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Blue pill/ }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /Red pill/ })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /Green pill/ })).toBeFocused()
    await page.keyboard.press('Enter')
    for (let n = 1; n <= 3; n++) {
      await expect(page.getByRole('heading', { name: `Solution ${n} of 3` })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Start over' })).toBeFocused()
      if (n === 2) {
        await page.getByRole('button', { name: 'I’ll try this' }).focus()
        await page.keyboard.press('Space')
      }
      await page.getByRole('button', { name: 'Next' }).focus()
      await page.keyboard.press('Enter')
    }
    await expect(page.getByRole('heading', { name: PLAN })).toBeFocused()
    const chosen = page.getByTestId('green-plan').getByRole('button', { pressed: true })
    await expect(chosen).toContainText('Create healthier digital boundaries')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    await expect(chosen).toHaveCount(2)
  })

  test('blue and green pills work in Gujarati', async ({ page }) => {
    await useLanguage(page, 'gu')
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /વાદળી ગોળી/ }).click()
    const line = page.getByRole('heading', {
      name: 'વાહ, સરસ પ્રયાસ! નજર ફેરવવાથી વાસ્તવિકતા ગાયબ નથી થતી. એના બદલે આ લઈ જુઓ.',
    })
    await expect(line).toBeFocused()
    await expect(line).toHaveAttribute('lang', 'gu')
    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: /લીલી ગોળી/ }).click()
    await expect(page.getByRole('heading', { name: 'ઉકેલ 1 / 3' })).toBeFocused()
    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: 'હું આ અજમાવીશ' }).click()
    await page.getByRole('button', { name: 'આગળ' }).click()
    await page.getByRole('button', { name: 'આગળ' }).click()
    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: 'આગળ' }).click()
    await expect(page.getByRole('heading', { name: 'તમારી યોજના' })).toBeFocused()
    await expect(page.getByTestId('green-plan').getByRole('button', { pressed: true })).toHaveCount(
      1,
    )
    await expectNoHorizontalOverflow(page)
  })

  test('360px wide: the swap and every green page fit, with both pill buttons on the first screen', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/yuvako/activity/pills')
    await page.getByRole('button', { name: /Blue pill/ }).click()
    await expect(page.getByRole('heading', { name: SWAP_LINE })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.waitForTimeout(SWAP_MS)
    await expectNoHorizontalOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page.getByRole('button', { name: /Red pill/ })).toBeInViewport()
    await expect(page.getByRole('button', { name: /Green pill/ })).toBeInViewport()
    await page.getByRole('button', { name: /Green pill/ }).click()
    for (let n = 1; n <= 3; n++) {
      await expect(page.getByRole('heading', { name: `Solution ${n} of 3` })).toBeVisible()
      await expectNoHorizontalOverflow(page)
      if (n < 3) await page.getByRole('button', { name: 'Next' }).first().click()
    }
  })
})
