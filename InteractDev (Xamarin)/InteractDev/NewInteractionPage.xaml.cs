using Realms;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using Xamarin.Forms;

using XFGloss;

namespace InteractDev
{
	public partial class NewInteractionPage : ContentPage
	{
		int ElapsedTime = 0;

		Editor NotesEditor;
		TeamMember SelectedTeamMember;

		Label ElapsedTimeLabel;

		List<TeamMember> Members;
		List<Button> EvaluationEmojiButtons;

		bool ShouldContinue = true;
		bool IsRunning = true;

		Realm LocalRealmInstance = Realm.GetInstance();

		Cell SelectedTeamMemberCell;
		Cell ElapsedTimeCell;

		string ElapsedTimeStr
		{
			get
			{
				var seconds = (int)(ElapsedTime % 60);
				var minutes = (int)(ElapsedTime / 60);
				var hours = (int)(minutes / 60);

				minutes = (int)(minutes % 60);

				return "" + (hours >= 10 ? "" + hours : "0" + hours) +
					":" + (minutes >= 10 ? "" + minutes : "0" + minutes) +
					":" + (seconds >= 10 ? "" + seconds : "0" + seconds);
			}
		}

		int Rating
		{
			get
			{
				var count = 0;

				foreach (var eb in EvaluationEmojiButtons)
				{
					count++;

					if (eb.Opacity >= 0.9)
						return count;
				}

				return 0;
			}
		}

		public NewInteractionPage()
		{
			InitializeComponent();

			ToolbarItems.Add(new ToolbarItem("Save", null, this.SaveInteraction));

			Device.StartTimer(TimeSpan.FromSeconds(1), this.RunTimer);

			Table.Root.Add(buildElapsedTime());
			Table.Root.Add(buildTeamMembers());
			Table.Root.Add(buildEvaluation());
			Table.Root.Add(buildNotes());
		}

		private void PauseResumeClock(object sender, EventArgs e)
		{
			ShouldContinue = !ShouldContinue;

			if (ShouldContinue)
			{
				CellGloss.SetBackgroundColor(ElapsedTimeCell, Color.White);

				if (!IsRunning)
				{
					IsRunning = true;

					Device.StartTimer(TimeSpan.FromSeconds(1), this.RunTimer);
				}
			}
			else
			{
				CellGloss.SetBackgroundColor(ElapsedTimeCell, Color.LightGoldenrodYellow);
			}
		}

		private async void SaveInteraction()
		{
			if (SelectedTeamMember == null)
			{
            	await DisplayAlert("Missing Fields!", "You must select a team member!", "OK");

				return;
			}

			if (Rating == 0)
			{
				await DisplayAlert("Missing Fields!", "A rating is required.", "OK");

				return;
			}

			var date = DateTimeOffset.UtcNow;

			date.AddSeconds(ElapsedTime * -1);

			InteractionLog il = new InteractionLog
			{
				Member = SelectedTeamMember,
				ElapsedTime = ElapsedTime,
				Rating = Rating,
				Note = NotesEditor.Text,
				Date = date,
				Shared = LocalSettings.AutomaticallyShareNotes
			};

			var identifier = await QuantiServer.PublishInteractionResult(il).ConfigureAwait(true);

			if (identifier == null)
			{
				await DisplayAlert("Error!", "Unable to contact the QuantiDev server. This interaction will only be saved locally.", "OK");

				return;
			} 
			else
				il.RemoteIdentifier = identifier;

			LocalRealmInstance.Write(() =>
			{
				LocalRealmInstance.Add(il);

				Navigation.PopAsync();

				System.Diagnostics.Debug.WriteLine("Saved!");
			});
		}

		private bool RunTimer()
		{
			if (!ShouldContinue)
			{
				IsRunning = false;

				return false;
			}
			
			ElapsedTime++;

			ElapsedTimeLabel.Text = ElapsedTimeStr;

			IsRunning = true;

			return true;
		}

		protected override void OnAppearing()
		{
			base.OnAppearing();
		}

		protected override void OnDisappearing()
		{
			base.OnDisappearing();

			LocalRealmInstance.Dispose();

			ShouldContinue = false;
		}

		TableSection buildElapsedTime()
		{
			var sect = new TableSection("Elapsed Time");

			var vc = new ViewCell();

			var sl = new StackLayout()
			{
				Orientation = StackOrientation.Vertical,
				VerticalOptions = LayoutOptions.FillAndExpand,
				HorizontalOptions = LayoutOptions.CenterAndExpand,
				HeightRequest = 75
			};

			var tc = new Label
			{
				Text = ElapsedTimeStr,
				FontSize = Device.GetNamedSize(NamedSize.Large, typeof(Label)),
				VerticalOptions = LayoutOptions.CenterAndExpand,
				HorizontalOptions = LayoutOptions.CenterAndExpand,
				LineBreakMode = LineBreakMode.NoWrap,
				HorizontalTextAlignment = TextAlignment.Center,
				WidthRequest = 200	//	Workaround for line break
			};

			ElapsedTimeLabel = tc;

			sl.Children.Add(tc);

			vc.View = sl;

			vc.Tapped += PauseResumeClock;

			sect.Add(vc);

			ElapsedTimeCell = vc;

			return sect;
		}

		TableSection buildTeamMembers() 
		{
			var sect = new TableSection("Team Member");

			Members = new List<TeamMember>();

			foreach (var member in LocalRealmInstance.All<TeamMember>())
			{
				Members.Add(member);
			}

			foreach (var m in Members)
			{
				var tc = new TextCell
				{
					Text = m.Name,
					Detail = m.Username
				};

				tc.Command = new Command(() =>
				{
					if (SelectedTeamMemberCell != null)
						CellGloss.SetBackgroundColor(SelectedTeamMemberCell, Color.White);

					SelectedTeamMember = m;
					SelectedTeamMemberCell = tc;
					
					CellGloss.SetBackgroundColor(tc, Color.LightGreen);
				});

				sect.Add(tc);
			}

			return sect;
		}

		TableSection buildEvaluation()
		{
			var sect = new TableSection("Evaluation");

			var vc = new ViewCell();

			var sl = new StackLayout()
			{
				Orientation = StackOrientation.Horizontal,
				HorizontalOptions = LayoutOptions.Center,
				HeightRequest = 75
			};

			var sm = new List<String>();

			sm.Add("😟");
			sm.Add("🙁");
			sm.Add("😶");
			sm.Add("😀");
			sm.Add("😁");

			EvaluationEmojiButtons = new List<Button>();

			int fs = 32;

			switch (Device.RuntimePlatform) {
				case Device.iOS:
					fs = 32;
					break;

				case Device.Android:
					fs = 24;
					break;
			}

			foreach (var emoji in sm)
			{
				Button b = new Button()
				{
					Text = emoji,
					HorizontalOptions = LayoutOptions.Center,
					VerticalOptions = LayoutOptions.Center,
					FontSize = fs,
					Opacity = 0.5,
					WidthRequest = 50
				};

				b.Command = new Command(() =>
				{
					foreach (var eb in EvaluationEmojiButtons)
					{
						eb.Opacity = 0.5;
					}

					b.Opacity = 1;
				});

				EvaluationEmojiButtons.Add(b);

				sl.Children.Add(b);
			}

			vc.View = sl;

			sect.Add(vc);

			return sect;
		}

		TableSection buildNotes()
		{
			var sect = new TableSection("Notes");

			var vc = new ViewCell()
			{
				Height = 200
			};

			NotesEditor = new Editor()
			{
				HeightRequest = 200,
				Margin = new Thickness(5, 5)
			};

			vc.View = NotesEditor;

			sect.Add(vc);

			return sect;
		}
	}
}
