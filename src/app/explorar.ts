import { AfterViewInit, Component, DestroyRef, ElementRef, NgZone, computed, inject, signal } from '@angular/core';
import { gsap } from 'gsap';
import Lenis from 'lenis';
import { DemoCampaign, DemoStore } from './demo-store';

const photos: Record<string, string> = {
  anta: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrxtNWzjc3YrEXIIKEmvYX3uY2uEJNhRTKlovEubo-48_SwK6gmW4bqIzxVx87ddKYc3Nj9MAU8xSkiStj-v75Rq5esqM6W9sRE0IHxdZGo6eQv5fbmD4Bv9Wu4EzrXzD2OAeo3Qpd6Y1v0bkOTh3ufOjOVUuCd6SRr7ENZ8AJG9F5eB5tBIVq6S5HrxmIriwh_1L4nhZ4jil8-7_G4KntNvtTQSp3W_UUF_WzlhM',
  luciana: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkaupnjSN_PvPKzuI6B_JyCJDbzsP4ZkWP-Xw1s6HJUB8stavmwfGKXPolGHvLlqJ4P6LzTgjrYysMqcFjmyIiWqDZHd087oNRQx05kaW_l3SiYjjjytcOu3UMDjJ7UdBgICPX5cZLMsrtJNDiouh6RlD2zzkVOfHdCVNePRz351TwKqLJd8DON9R7lb_vnbF0Fsq-4p_SvwT-GLeCHQ7xFUx0yC5cWPKDLpWKP3M',
  comedor: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDo3KS_3Cu9ECRovpLqpafe9FQsXM4C_Gh0Eas0Cgfuun0eycauXkHj-0Ptx6mQwYr-YyyDsao56cWLFqyBdNfexhEcOi2mA2dMgshNWN9C9R-oW7v_KEs4GF1TxNZVGOH4wLt01E-i704DGIuYS4R8qz86a7FcNbMKezwY5_mnLEn-xIwO5TmYeGKFb2Bv38FgsVnNpPwCBXkCrQ-wXWVnvYkGZhsW_u4MWOn9d5U',
  paucartambo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBij9KhYZaX1Ix_FvNctl4GboRdFZvNDHpcUfwVJ-cXp8PfW9FUYC37KixAo0P1QM4WyqpCVUm8QT6NZ805Zdur26rnP1ZjHjVF3dOwTyYvKHZksh0U6THk3M9oBIwXqx_TEfX9LJX7C5FfENhkh8TBFPKTleWtbr73Bww7anXf5wzwp0khvX5jKNkJPMDYQXiQLntS6JsA9H53SH_E5SMli3cEtD78_Y_giezTXnE',
  ayacucho: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAitsbKVRQ4zXNjIVkYvsCfE0nZkOv9daH94D4eUkrAA9hcsqoYxs0hn2Si0hwukEm9kQmloUGRMaL7gAJtk99CpmCZNZGDyENTEftF_izyi6KfUpRfyC_Sg2FqWq9OzNFTz4ypStRFtS1x0LjjGaO6vwxKncduEg2FPi2HEhPrdg_GTEbIC_IkSn_MJzmbTTHP4VkNozrr-tPLQdZnc0CAj_-zfwst4O_2Z_h6Ca8',
};

@Component({
  selector: 'app-explorar',
  standalone: true,
  templateUrl: './explorar.html',
  styleUrl: './explorar.css',
})
export class Explorar implements AfterViewInit {
  readonly store = inject(DemoStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  readonly filter = signal('Todas');
  readonly featured = computed(() => this.store.campaign('anta'));
  readonly filters = computed(() => ['Todas', ...new Set(this.store.campaigns().map((campaign) => campaign.category))]);
  readonly visibleCampaigns = computed(() => this.store.campaigns().filter((campaign) =>
    this.filter() === 'Todas' ? campaign.id !== 'anta' : campaign.category === this.filter()));

  ngAfterViewInit(): void {
    if (typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.zone.runOutsideAngular(() => {
      const context = gsap.context(() => {
        gsap.fromTo('.hero-photo img', { scale: 1.06 }, { scale: 1, duration: 1.8, ease: 'power2.out' });
        gsap.fromTo('.hero-line', { scaleX: 0 }, { scaleX: 1, duration: 1.1, delay: 0.2, ease: 'power2.out' });
      }, this.host);
      const lenis = new Lenis({ anchors: true, autoRaf: true });
      this.destroyRef.onDestroy(() => {
        context.revert();
        lenis.destroy();
      });
    });
  }

  count(category: string): number {
    return this.store.campaigns().filter((campaign) => category === 'Todas' || campaign.category === category).length;
  }

  format(amount: number): string {
    return amount.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }

  percent(campaign: DemoCampaign): number {
    return campaign.goal > 0 ? Math.min(100, Math.round(campaign.raised / campaign.goal * 100)) : 0;
  }

  photo(campaign: DemoCampaign): string | undefined {
    return campaign.photo?.data || photos[campaign.id];
  }

  storyUrl(campaign: DemoCampaign): string {
    return campaign.id === 'anta' ? '/historia' : `/historia/${campaign.id}`;
  }
}
