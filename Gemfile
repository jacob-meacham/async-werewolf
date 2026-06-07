source "https://rubygems.org"

# Local development uses a modern Jekyll (the deployed GitHub Pages build runs
# remotely with its own gem set and ignores this Gemfile). Kept in sync with the
# plugins GitHub Pages supports: jekyll-feed and jekyll-seo-tag.
gem "jekyll", "~> 4.3"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
end

# Ruby 3.4 removed these from the default gems.
gem "base64"
gem "csv"
gem "logger"
gem "bigdecimal"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.0" if Gem.win_platform?
