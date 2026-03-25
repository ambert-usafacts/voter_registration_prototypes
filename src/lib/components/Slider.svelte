<script>
  import { Slider, useId } from "bits-ui";

  const sliderId = useId();

  let { 
    value = $bindable(50),
    min = 0, 
    max = 100, 
    step = 1,
    label = "Select a value",
    labelAlign = "center",
    id = sliderId,
    onValueCommit = () => {},
  } = $props();

  function adjust(amount) {
    const nextValue = value + amount;
    value = Math.max(min, Math.min(max, nextValue));
  }
</script>

<div class="container">
  {#if label}
    <label for={id} class="slider-label {labelAlign}">
      {label}
    </label>
  {/if}

  <div class="slider-container">
    <button 
      type="button"
      class="control-btn" 
      aria-label="Decrease value"
      onclick={() => {adjust(-step); onValueCommit();}}
      disabled={value <= min}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.63816 13.354L4.63816 8.35403C4.59167 8.30759 4.55479 8.25245 4.52963 8.19175C4.50447 8.13105 4.49152 8.06599 4.49152 8.00028C4.49152 7.93457 4.50447 7.86951 4.52963 7.80881C4.55479 7.74811 4.59167 7.69296 4.63816 7.64653L9.63816 2.64653C9.73198 2.55271 9.85923 2.5 9.99191 2.5C10.1246 2.5 10.2518 2.55271 10.3457 2.64653C10.4395 2.74035 10.4922 2.8676 10.4922 3.00028C10.4922 3.13296 10.4395 3.26021 10.3457 3.35403L5.69878 8.00028L10.3457 12.6465C10.3921 12.693 10.429 12.7481 10.4541 12.8088C10.4792 12.8695 10.4922 12.9346 10.4922 13.0003C10.4922 13.066 10.4792 13.131 10.4541 13.1917C10.429 13.2524 10.3921 13.3076 10.3457 13.354C10.2992 13.4005 10.2441 13.4373 10.1834 13.4625C10.1227 13.4876 10.0576 13.5006 9.99191 13.5006C9.92621 13.5006 9.86116 13.4876 9.80046 13.4625C9.73976 13.4373 9.68461 13.4005 9.63816 13.354Z" fill="currentColor"/>
      </svg>
    </button>

    <Slider.Root
      type="single"
      bind:value
      {min}
      {max}
      {step}
      {id}
      {onValueCommit}
      class="slider-root"
    >
      <span class="slider-track">
        <Slider.Range class="slider-range" />
      </span>
      <Slider.Thumb index={0} class="slider-thumb" />
      <Slider.ThumbLabel index={0} position="bottom" class="slider-thumb-label">
        {value}
      </Slider.ThumbLabel>
    </Slider.Root>

    <button 
      type="button"
      class="control-btn" 
      aria-label="Increase value"
      onclick={() => {adjust(step); onValueCommit();}}
      disabled={value >= max}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.36086 2.64451L11.3609 7.64451C11.4074 7.69094 11.4442 7.74609 11.4694 7.80679C11.4946 7.86749 11.5075 7.93255 11.5075 7.99826C11.5075 8.06396 11.4946 8.12903 11.4694 8.18973C11.4442 8.25043 11.4074 8.30557 11.3609 8.35201L6.36086 13.352C6.26704 13.4458 6.1398 13.4985 6.00711 13.4985C5.87443 13.4985 5.74718 13.4458 5.65336 13.352C5.55954 13.2582 5.50684 13.1309 5.50684 12.9983C5.50684 12.8656 5.55954 12.7383 5.65336 12.6445L10.3002 7.99826L5.65336 3.35201C5.60691 3.30555 5.57006 3.2504 5.54492 3.1897C5.51978 3.12901 5.50684 3.06395 5.50684 2.99826C5.50684 2.93256 5.51978 2.86751 5.54492 2.80681C5.57006 2.74611 5.60691 2.69096 5.65336 2.64451C5.69982 2.59805 5.75497 2.5612 5.81567 2.53606C5.87636 2.51092 5.94142 2.49798 6.00711 2.49798C6.07281 2.49798 6.13787 2.51092 6.19856 2.53606C6.25926 2.5612 6.31441 2.59805 6.36086 2.64451Z" fill="currentColor"/>
      </svg>

    </button>
  </div>
</div>

<style>
  .container {  
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .slider-container {
    display: flex;
    align-items: center;
    gap: 2px;
    width: 100%;
    max-width: 300px;
    margin-bottom: 16px;
  }

  .control-btn {
    width: 26px;
    height: 26px;
    min-width: 26px;
    min-height: 26px;
    padding: 0;
    border: none;
    box-sizing: border-box;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 1;
    font-size: 1.2rem;
    color: var(--gray-500);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .control-btn:hover:not(:disabled) {
    color: var(--magenta-500);
  }

  :global(.slider-root) {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 20px;
    touch-action: none;
  }

  :global(.slider-root:hover .slider-track) {
    background-color: var(--magenta-500);
  }

  :global(.slider-root:hover .slider-range) {
    background-color: var(--magenta-500);
  }

  :global(.slider-track) {
    background-color: var(--gray-500);
    position: relative;
    flex-grow: 1;
    height: 1px;
    border-radius: 10px;
    transition: background-color 0.2s;
  }

  :global(.slider-range) {
    position: absolute;
    background-color: var(--gray-500);
    border-radius: 10px;
    height: 100%;
    transition: background-color 0.2s;
  }

  :global(.slider-thumb) {
    display: block;
    width: 20px;
    height: 20px;
    background-color: var(--gray-20);
    border: 1px solid var(--gray-500);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
    transition: border-color 0.2s;
  }

  :global(.slider-root:hover .slider-thumb) {
    border-color: var(--magenta-500);
  }

  :global(.slider-thumb[data-active]) {
    border-color: var(--gray-800);
  }

  :global(.slider-thumb-label) {
    font-size: 12px;
    font-weight: 500;
    padding-top: 6px;
    font-weight: 700;
  }

  .slider-label {
    color: var(--gray-700);
    width: 100%;
    max-width: 400px;
    margin-bottom: 2px;
    font-size: 14px;
    font-weight: 500;
    display: block;
  }

  .slider-label.left {
    text-align: left;
  }

  .slider-label.center {
    text-align: center;
  }

  .slider-label.right {
    text-align: right;
  }
</style>