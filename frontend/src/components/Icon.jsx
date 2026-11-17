import arrow from '../assets/icons/arrow.svg'
import bell from '../assets/icons/bell.svg'
import board from '../assets/icons/board.svg'
import calendar from '../assets/icons/calendar.svg'
import check from '../assets/icons/check.svg'
import checklist from '../assets/icons/checklist.svg'
import chevron from '../assets/icons/chevron.svg'
import circle from '../assets/icons/circle.svg'
import clock from '../assets/icons/clock.svg'
import close from '../assets/icons/close.svg'
import down from '../assets/icons/down.svg'
import download from '../assets/icons/download.svg'
import eye from '../assets/icons/eye.svg'
import eyeOff from '../assets/icons/eye-off.svg'
import filter from '../assets/icons/filter.svg'
import grid from '../assets/icons/grid.svg'
import lock from '../assets/icons/lock.svg'
import logout from '../assets/icons/logout.svg'
import more from '../assets/icons/more.svg'
import plus from '../assets/icons/plus.svg'
import search from '../assets/icons/search.svg'
import settings from '../assets/icons/settings.svg'
import trash from '../assets/icons/trash.svg'
import users from '../assets/icons/users.svg'

const icons = {
  arrow,
  bell,
  board,
  calendar,
  check,
  checklist,
  chevron,
  circle,
  clock,
  close,
  down,
  download,
  eye,
  'eye-off': eyeOff,
  filter,
  grid,
  lock,
  logout,
  more,
  plus,
  search,
  settings,
  trash,
  users,
}

export default function Icon({ name, size = 18 }) {
  const mask = `url("${icons[name]}")`

  return (
    <span
      className="icon-glyph"
      aria-hidden="true"
      style={{ width: size, height: size, maskImage: mask, WebkitMaskImage: mask }}
    />
  )
}
