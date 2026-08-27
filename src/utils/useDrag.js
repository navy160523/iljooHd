import { ref } from 'vue'

let startX = 0
let startY = 0
let dragging = false
let target = null

/** 
 * - 마우스를 클릭하여 드래그 하는 기능 (마우스 클릭시 이벤트 시작)
 * - 클릭할 공간에 추가 (@mousedown="startDragging")
 */
export function startDragging(event) {

  if (event.button === 0) {
    dragging = true
    // target = event.target.parentNode
    target = event.currentTarget.parentNode
    
    //target 기본 margin : 24px
    startX = event.offsetX + 24
    startY = event.offsetY + 24
  }
}

/**
 * - 마우스를 클릭하여 드래그 하는 기능 (마우스를 움직여 드래그 이벤트 진행)
 * - 드래그 할 창 전체에 추가 (@mousemove="handleDragging")
 */
export function handleDragging(event) {

  if (dragging) {

    const dx = event.clientX - startX
    const dy = event.clientY - startY

    target.style.left = dx + 'px'
    target.style.top = dy + 'px'
  }
}

/**
 * - 마우스를 클릭하여 드래그 하는 기능 (마우스 떼서 이벤트 종료)
 * - 드래그 할 창 전체에 추가 (@mouseup="stopDragging")
 */
export function stopDragging() {
  dragging = false
}