import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { SubscriptionTracker } from 'app/subscription-tracker/subscription-tracker'
import { MobileNavState } from '../http.service'

@Component({
  selector: 'app-alt-blocks-details-component',
  templateUrl: './alt-blocks-details.component.html',
  styleUrls: ['./alt-blocks-details.component.scss'],
  providers: [],
})
export class AltBlocksDetailsComponent extends SubscriptionTracker implements OnInit {
  altBlocksDetails: any = {};
  info: any;
  transactList: any;
  navIsOpen: boolean;
  searchIsOpen: boolean = false;
  onIsVisible($event): void {
    this.searchIsOpen = $event;
  }
  constructor(private route: ActivatedRoute,
              private mobileNavState: MobileNavState) {
      super()
      this.navIsOpen = false;
  }

  ngOnInit() {
    this.info = this.route.snapshot.data['MainInfo'];
    this.altBlocksDetails = this.route.snapshot.data['AltBlock'];
    console.log(this.altBlocksDetails.transactions_details, 'fucker')
    this.transactList = JSON.parse(this.altBlocksDetails.transactions_details);

    this.mobileNavState.change.subscribe(navIsOpen => {
      this.navIsOpen = navIsOpen;
    });
  }
}

